package it.gov.innovazione.ndc.admin.controller;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Enumeration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

/**
 * Reverse proxy verso il BE NDC.
 *
 * <p>Tutte le request a /bff/api/** (tranne /bff/api/me) vengono inoltrate al
 * BE preservando method, path (dopo /bff/api), query string, body e
 * content-type. Il bearer JWT viene aggiunto qui sopra dal token estratto
 * dall'{@link OAuth2AuthorizedClient} di sessione.
 *
 * <p>Implementazione blocking via {@link RestClient}: body request e response
 * sono materializzati in memoria come {@code byte[]}. Upload e download grossi
 * (es. /validate/syntax con file RDF, /harvest/vocabularies.db) restano nel
 * regime di alcuni MB - decine di MB: gestibile senza streaming.
 *
 * <p>In risposta forwardiamo solo {@code Content-Type} e
 * {@code Content-Disposition}: tutto il resto (cache headers, security
 * headers, transfer encoding) lo gestisce il BFF stesso. Evita header
 * duplicati che altrimenti si sommerebbero a quelli che il BFF aggiunge gia'
 * di suo.
 */
@RestController
@RequestMapping("/bff/api")
@RequiredArgsConstructor
@Slf4j
public class ProxyController {

    private static final String PREFIX = "/bff/api";

    private final RestClient backendRestClient;

    @RequestMapping("/**")
    public ResponseEntity<byte[]> proxy(
            HttpServletRequest request,
            @RegisteredOAuth2AuthorizedClient("keycloak") OAuth2AuthorizedClient authorizedClient)
            throws IOException {

        String path = request.getRequestURI().substring(PREFIX.length());
        String query = request.getQueryString();
        HttpMethod method = HttpMethod.valueOf(request.getMethod());
        String bearerToken = authorizedClient.getAccessToken().getTokenValue();

        log.debug("[proxy] {} {}{}", method, path, query != null ? "?" + query : "");

        RestClient.RequestBodySpec spec = backendRestClient
                .method(method)
                .uri(uriBuilder -> {
                    uriBuilder.path(path);
                    if (query != null) {
                        uriBuilder.query(query);
                    }
                    return uriBuilder.build();
                })
                .headers(headers -> {
                    headers.setBearerAuth(bearerToken);
                    copyForwardableRequestHeaders(request, headers);
                });

        if (hasRequestBody(method)) {
            byte[] bodyBytes = request.getInputStream().readAllBytes();
            if (bodyBytes.length > 0) {
                spec.body(bodyBytes);
            }
        }

        ResponseEntity<byte[]> upstream = spec.retrieve().toEntity(byte[].class);

        // Un 401 dall'upstream significa che il BE NDC ha rifiutato il bearer
        // inoltrato dal BFF (token non valido per quel resource server, o
        // configurazione errata), NON che la sessione utente sul BFF sia
        // scaduta. Il 401 "legittimo" di sessione scaduta lo emette il
        // SecurityFilterChain (HttpStatusEntryPoint su /bff/api/**) prima ancora
        // di arrivare qui. Se rilanciassimo il 401 upstream tale e quale, la SPA
        // (NdcClient) lo interpreterebbe come sessione scaduta e farebbe
        // ripartire il flow OAuth2 in un loop infinito di redirect. Lo mappiamo
        // a 502 Bad Gateway: e' un errore di gateway, non di autenticazione.
        if (upstream.getStatusCode().value() == HttpStatus.UNAUTHORIZED.value()) {
            log.warn("[proxy] upstream {} {} returned 401 (backend rejected BFF bearer) -> mapping to 502", method, path);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }

        return forwardResponse(upstream);
    }

    private static boolean hasRequestBody(HttpMethod method) {
        return method != HttpMethod.GET
                && method != HttpMethod.HEAD
                && method != HttpMethod.DELETE
                && method != HttpMethod.OPTIONS;
    }

    private static ResponseEntity<byte[]> forwardResponse(ResponseEntity<byte[]> upstream) {
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(upstream.getStatusCode());
        MediaType contentType = upstream.getHeaders().getContentType();
        if (contentType != null) {
            builder.contentType(contentType);
        }
        String contentDisposition = upstream.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION);
        if (contentDisposition != null) {
            builder.header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition);
        }
        return builder.body(upstream.getBody());
    }

    private static void copyForwardableRequestHeaders(HttpServletRequest request, HttpHeaders headers) {
        Enumeration<String> names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            // Authorization riscritto dal proxy; Host/Cookie/Content-Length non
            // vanno propagati; Accept-Encoding rimosso per evitare risposte
            // gzippate che andremmo a forwardare senza decomprimere.
            if (name.equalsIgnoreCase(HttpHeaders.AUTHORIZATION)
                    || name.equalsIgnoreCase(HttpHeaders.HOST)
                    || name.equalsIgnoreCase(HttpHeaders.COOKIE)
                    || name.equalsIgnoreCase(HttpHeaders.CONTENT_LENGTH)
                    || name.equalsIgnoreCase(HttpHeaders.ACCEPT_ENCODING)) {
                continue;
            }
            headers.add(name, request.getHeader(name));
        }
    }
}
