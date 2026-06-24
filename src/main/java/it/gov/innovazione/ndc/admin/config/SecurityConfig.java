package it.gov.innovazione.ndc.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(
            HttpSecurity http,
            OAuth2AuthorizationRequestResolver pkceResolver,
            OidcUserService oidcUserService,
            ClientRegistrationRepository clientRegistrationRepository)
            throws Exception {
        // CSRF abilitato (l'app e' session-based con cookie JSESSIONID).
        // Pattern double-submit cookie: il token viaggia nel cookie XSRF-TOKEN (leggibile da JS
        // perche' same-origin) e il client lo rispedisce nell'header X-XSRF-TOKEN.
        CookieCsrfTokenRepository csrfRepo = CookieCsrfTokenRepository.withHttpOnlyFalse();
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null); // disabilita la deferred resolution

        http.authorizeHttpRequests(req -> req.requestMatchers(
                                "/",
                                "/index.html",
                                "/favicon.ico",
                                "/favicon.svg",
                                "/assets/**",
                                "/static/**",
                                "/login/**",
                                "/oauth2/**",
                                "/actuator/health",
                                // /.well-known/* viene chiesta automaticamente da Chrome
                                // (es. /.well-known/appspecific/com.chrome.devtools.json per i
                                // workspace di DevTools). Se non e' permessa, Spring Security la
                                // salva come "saved request" e dopo il successivo login OAuth2
                                // l'utente viene rediretto su un URL inesistente -> whitelabel 404.
                                "/.well-known/**")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                // Per richieste API non autenticate ritorna 401 invece di redirect HTML al login.
                .exceptionHandling(eh -> eh.defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED), apiMatcher()))
                .oauth2Login(oauth2 -> oauth2.authorizationEndpoint(ae -> ae.authorizationRequestResolver(pkceResolver))
                        .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oidcUserService)))
                // RP-Initiated Logout: oltre a invalidare la sessione BFF locale, chiude la
                // sessione SSO su Keycloak via end-session endpoint. Con id_token_hint Keycloak
                // non mostra la pagina di conferma e rimanda direttamente al pannello.
                // Senza questo, dopo il /logout locale Keycloak ri-autentica silenziosamente
                // (SSO ancora attivo) e l'utente torna loggato.
                .logout(logout -> logout.logoutSuccessHandler(oidcLogoutSuccessHandler(clientRegistrationRepository))
                        .permitAll())
                .csrf(csrf -> csrf.csrfTokenRepository(csrfRepo).csrfTokenRequestHandler(csrfHandler));

        return http.build();
    }

    /**
     * Redirige al logout endpoint di Keycloak dopo l'invalidazione della sessione locale.
     * {@code {baseUrl}} si risolve all'origin pubblico del pannello (dietro route edge TLS,
     * grazie a SERVER_FORWARD_HEADERS_STRATEGY=framework) e deve combaciare con
     * {@code post.logout.redirect.uris} configurato sul client nel realm.
     */
    private LogoutSuccessHandler oidcLogoutSuccessHandler(ClientRegistrationRepository repo) {
        OidcClientInitiatedLogoutSuccessHandler handler = new OidcClientInitiatedLogoutSuccessHandler(repo);
        handler.setPostLogoutRedirectUri("{baseUrl}");
        return handler;
    }

    /**
     * Abilita PKCE anche per client confidential: extra protezione contro
     * authorization code interception. Standard OAuth2 + best practice OWASP.
     */
    @Bean
    OAuth2AuthorizationRequestResolver pkceAuthorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository) {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
        return resolver;
    }

    private RequestMatcher apiMatcher() {
        return PathPatternRequestMatcher.withDefaults().matcher("/bff/api/**");
    }
}
