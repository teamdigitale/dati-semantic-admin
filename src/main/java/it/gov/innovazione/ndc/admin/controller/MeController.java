package it.gov.innovazione.ndc.admin.controller;

import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint di servizio per la SPA: ritorna info dell'utente autenticato.
 * Usato dalla SPA per capire se la sessione è attiva e quale utente è loggato.
 */
@RestController
@RequestMapping("/bff/api")
public class MeController {

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal OidcUser user) {
        return Map.of(
                "username",
                user.getPreferredUsername(),
                "name",
                user.getFullName() != null ? user.getFullName() : user.getPreferredUsername(),
                "email",
                user.getEmail() != null ? user.getEmail() : "",
                "scopes",
                user.getAuthorities().stream().map(Object::toString).toList());
    }
}
