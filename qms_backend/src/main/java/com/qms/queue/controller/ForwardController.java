package com.qms.queue.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ForwardController {

    @GetMapping(value = { "/", "/login", "/register", "/admin/**", "/interviewer/**" })
    public String redirect() {
        // Forward to index.html so that React Router can handle the routing
        return "forward:/index.html";
    }
}
