package com.qms.queue.service.ServiceImpl;

import com.qms.queue.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @Override
    @Async("emailTaskExecutor")
    public void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping email — recipient address is blank");
            return;
        }

        String finalApiKey = (apiKey != null) ? apiKey.trim() : "";
        if (finalApiKey.isEmpty()) {
            log.error("Brevo API key is missing. Cannot send email to '{}'", to);
            return;
        }

        try {
            log.info("Sending email via Brevo API → to: '{}', subject: '{}'", to, subject);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", finalApiKey);

            // Use a structured payload to avoid manual JSON escaping issues
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            
            java.util.Map<String, String> sender = new java.util.HashMap<>();
            sender.put("name", fromName);
            sender.put("email", fromAddress);
            payload.put("sender", sender);

            java.util.List<java.util.Map<String, String>> toList = new java.util.ArrayList<>();
            java.util.Map<String, String> recipient = new java.util.HashMap<>();
            recipient.put("email", to);
            toList.add(recipient);
            payload.put("to", toList);

            payload.put("subject", subject);
            payload.put("htmlContent", body);

            HttpEntity<java.util.Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully via Brevo API to: '{}'", to);
            } else {
                log.error("Brevo API returned non-2xx status: {} for recipient: '{}'", response.getStatusCode(), to);
            }

        } catch (Exception e) {
            log.error("Brevo API error sending email to '{}' [subject: {}]: {}", to, subject, e.getMessage());
        }
    }
}
