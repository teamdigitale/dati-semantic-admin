package it.gov.innovazione.ndc.admin.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

/**
 * Estrae i realm roles dal claim {@code realm_access.roles} di Keycloak
 * e li converte in authorities Spring nella forma {@code ROLE_<UPPERCASE>}.
 *
 * Esempio: realm role "ndc-admin" -> authority "ROLE_NDC_ADMIN", utilizzabile via
 * {@code @PreAuthorize("hasRole('NDC_ADMIN')")}.
 */
@Service
public class KeycloakOidcUserService extends OidcUserService {

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        Collection<GrantedAuthority> authorities = new ArrayList<>(oidcUser.getAuthorities());
        for (String role : extractRealmRoles(oidcUser.getClaims())) {
            authorities.add(
                    new SimpleGrantedAuthority("ROLE_" + role.toUpperCase().replace('-', '_')));
        }

        String nameAttributeKey = userRequest
                .getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();
        if (nameAttributeKey == null || nameAttributeKey.isBlank()) {
            nameAttributeKey = "sub";
        }
        return new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo(), nameAttributeKey);
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRealmRoles(Map<String, Object> claims) {
        Object realmAccess = claims.get("realm_access");
        if (realmAccess instanceof Map<?, ?> map) {
            Object roles = ((Map<String, Object>) map).get("roles");
            if (roles instanceof List<?> list) {
                return list.stream().map(Object::toString).toList();
            }
        }
        return List.of();
    }
}
