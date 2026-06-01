package it.gov.innovazione.ndc.admin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.DefaultUriBuilderFactory;
import org.springframework.web.util.DefaultUriBuilderFactory.EncodingMode;

/**
 * RestClient blocking verso il BE NDC.
 *
 * <p>Il bearer JWT viene aggiunto a mano dal {@code ProxyController} estraendo
 * il token dall'{@code OAuth2AuthorizedClient}: niente filter OAuth2 lato HTTP,
 * cosi' il codice resta sincrono e debuggabile.
 *
 * <p>{@code defaultStatusHandler} con predicato {@code _ -> true} disabilita
 * la default error-throwing di RestClient: il proxy deve forwardare anche
 * 4xx/5xx upstream al FE senza generare eccezioni qui.
 *
 * <p>L'{@link UriBuilderFactory} e' configurato in {@link EncodingMode#NONE}:
 * il proxy passa {@code path} e {@code query} prelevati da
 * {@code HttpServletRequest.getRequestURI()/getQueryString()}, che sono gia'
 * URL-encoded dal browser. Un encoding di default li doppia-encoderebbe
 * (es. {@code %3A} -> {@code %253A}) e al BE arriverebbe spazzatura. Vedi
 * {@code ProxyController#proxy}.
 */
@Configuration
public class BackendRestClientConfig {

    @Value("${ndc.bff.backend-url}")
    private String backendUrl;

    @Bean
    RestClient backendRestClient() {
        DefaultUriBuilderFactory uriBuilderFactory = new DefaultUriBuilderFactory(backendUrl);
        uriBuilderFactory.setEncodingMode(EncodingMode.NONE);
        return RestClient.builder()
                .uriBuilderFactory(uriBuilderFactory)
                .defaultStatusHandler(status -> true, (request, response) -> {
                    // no-op: forward upstream status/body as-is to the caller.
                })
                .build();
    }
}
