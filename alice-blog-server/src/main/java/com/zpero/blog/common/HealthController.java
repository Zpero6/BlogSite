package com.zpero.blog.common;
import java.util.Map;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1")
public class HealthController {
 @GetMapping("/health") public Map<String,String> health(){return Map.of("status","UP","service","zpero-blog");}
 @GetMapping("/auth/csrf") public Map<String,String> csrf(CsrfToken token){return Map.of("token",token.getToken(),"headerName",token.getHeaderName());}
}
