package it.gov.innovazione.ndc.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwarda tutte le richieste GET di path non-API a index.html, in modo che
 * il client-side routing della SPA (react-router) gestisca la navigazione.
 *
 * Esclusi: /bff/api/**, /actuator/**, /oauth2/**, /login/**, /assets/**
 * (gestiti dai rispettivi controller o serviti come static resources).
 */
@Controller
public class SpaFallbackController {

    @GetMapping(value = {
        "/{path:[^.]*}",                              // /repositories, /harvest, ecc.
        "/{path:^(?!bff|actuator|oauth2|login|assets|static).*}/{sub:[^.]*}"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
