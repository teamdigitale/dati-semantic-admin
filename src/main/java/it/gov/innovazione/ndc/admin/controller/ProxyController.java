package it.gov.innovazione.ndc.admin.controller;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reverse proxy verso il BE NDC.
 * Tutte le request a /bff/api/** (tranne /bff/api/me) vengono inoltrate al BE,
 * preservando method, path (dopo /bff/api), query string, body e content-type.
 * Il bearer JWT viene aggiunto automaticamente dal WebClient OAuth2-aware.
 *
 * Body request e response sono trasferiti in streaming via Flux<DataBuffer>
 * per evitare di caricare in memoria upload o response di grandi dimensioni
 * (utile per /validate/syntax con file RDF o per /harvest/vocabularies.db).
 */
@RestController
@RequestMapping("/bff/api")
@RequiredArgsConstructor
public class ProxyController {

    private static final String PREFIX = "/bff/api";
    private static final DefaultDataBufferFactory BUFFER_FACTORY = new DefaultDataBufferFactory();

    private final WebClient backendWebClient;

    @RequestMapping("/**")
    public Mono<ResponseEntity<Flux<DataBuffer>>> proxy(HttpServletRequest request) {
        String path = request.getRequestURI().substring(PREFIX.length());
        String query = request.getQueryString();
        URI uri = URI.create(path + (query != null ? "?" + query : ""));

        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        WebClient.RequestBodySpec spec =
                backendWebClient.method(method).uri(uri).headers(headers -> copyForwardableHeaders(request, headers));

        if (method == HttpMethod.GET || method == HttpMethod.DELETE || method == HttpMethod.HEAD) {
            return spec.exchangeToMono(this::toResponseEntity);
        }

        // Streaming del body request: legge l'InputStream del servlet come Flux<DataBuffer>
        // senza materializzare l'intero payload in un byte[].
        Flux<DataBuffer> bodyFlux = DataBufferUtils.readInputStream(request::getInputStream, BUFFER_FACTORY, 8192);

        return spec.body(BodyInserters.fromDataBuffers(bodyFlux)).exchangeToMono(this::toResponseEntity);
    }

    private void copyForwardableHeaders(HttpServletRequest request, HttpHeaders headers) {
        var names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            // Authorization viene aggiunto dal filter OAuth2 del WebClient.
            // Host/Cookie/Content-Length non vanno propagati.
            if (name.equalsIgnoreCase(HttpHeaders.AUTHORIZATION)
                    || name.equalsIgnoreCase(HttpHeaders.HOST)
                    || name.equalsIgnoreCase(HttpHeaders.COOKIE)
                    || name.equalsIgnoreCase(HttpHeaders.CONTENT_LENGTH)) {
                continue;
            }
            headers.add(name, request.getHeader(name));
        }
    }

    private Mono<ResponseEntity<Flux<DataBuffer>>> toResponseEntity(
            org.springframework.web.reactive.function.client.ClientResponse clientResponse) {
        return Mono.just(ResponseEntity.status(clientResponse.statusCode())
                .headers(clientResponse.headers().asHttpHeaders())
                .body(clientResponse.bodyToFlux(DataBuffer.class)));
    }
}
