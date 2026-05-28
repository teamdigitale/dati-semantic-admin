package it.gov.innovazione.ndc.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, OAuth2AuthorizationRequestResolver pkceResolver)
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
                                "/assets/**",
                                "/static/**",
                                "/login/**",
                                "/oauth2/**",
                                "/actuator/health")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                // Per richieste API non autenticate ritorna 401 invece di redirect HTML al login.
                .exceptionHandling(eh -> eh.defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED), apiMatcher()))
                .oauth2Login(
                        oauth2 -> oauth2.authorizationEndpoint(ae -> ae.authorizationRequestResolver(pkceResolver)))
                .logout(logout -> logout.logoutSuccessUrl("/").permitAll())
                .csrf(csrf -> csrf.csrfTokenRepository(csrfRepo).csrfTokenRequestHandler(csrfHandler));

        return http.build();
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
