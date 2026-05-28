package it.gov.innovazione.ndc.admin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.reactive.function.client.ServletOAuth2AuthorizedClientExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * WebClient configurato per chiamare il BE NDC con il bearer JWT
 * dell'utente loggato (oppure del service account quando applicabile).
 *
 * Il filter {@link ServletOAuth2AuthorizedClientExchangeFilterFunction}
 * recupera l'OAuth2AuthorizedClient dalla sessione e inietta automaticamente
 * il bearer header. Gestisce anche il refresh del token quando necessario.
 */
@Configuration
public class WebClientConfig {

    @Value("${ndc.bff.backend-url}")
    private String backendUrl;

    @Bean
    WebClient backendWebClient(OAuth2AuthorizedClientManager authorizedClientManager) {
        ServletOAuth2AuthorizedClientExchangeFilterFunction oauth2 =
            new ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
        oauth2.setDefaultOAuth2AuthorizedClient(true);

        return WebClient.builder()
            .baseUrl(backendUrl)
            .apply(oauth2.oauth2Configuration())
            .build();
    }
}
