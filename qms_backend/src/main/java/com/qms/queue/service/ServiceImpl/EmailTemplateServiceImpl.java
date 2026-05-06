package com.qms.queue.service.ServiceImpl;

import com.qms.queue.service.EmailTemplateService;
import org.springframework.stereotype.Service;

@Service
public class EmailTemplateServiceImpl implements EmailTemplateService {

    private static final String TEAL_DARK = "#0f766e";
    private static final String TEAL_MID = "#0d9488";
    private static final String TEAL_LIGHT = "#ccfbf1";
    private static final String AMBER_DARK = "#b45309";
    private static final String AMBER_MID = "#d97706";
    private static final String AMBER_LIGHT = "#fef3c7";
    private static final String BG_PAGE = "#f0f4f8";
    private static final String BG_CARD = "#ffffff";
    private static final String TEXT_MAIN = "#1e293b";
    private static final String TEXT_MUTED = "#64748b";
    private static final String DIVIDER = "#e2e8f0";

    private String wrap(String accentColor, String cardBody) {
        return "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "  <meta charset=\"UTF-8\" />" +
                "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\" />" +
                "  <title>QMS Notification</title>" +
                "</head>" +
                "<body style=\"margin:0;padding:0;background-color:" + BG_PAGE
                + ";font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;\">" +

                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">" +
                "<tr><td align=\"center\" style=\"padding:40px 16px;\">" +

                "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" " +
                "       style=\"max-width:600px;width:100%;background-color:" + BG_CARD + ";" +
                "              border-radius:12px;overflow:hidden;" +
                "              box-shadow:0 4px 24px rgba(0,0,0,0.08);\">" +

                "<tr><td height=\"6\" style=\"background-color:" + accentColor
                + ";font-size:0;line-height:0;\">&nbsp;</td></tr>" +

                "<tr><td align=\"center\" style=\"padding:32px 40px 0;\">" +
                "  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">" +
                "  <tr>" +
                "    <td align=\"center\">" +
                "      <div style=\"display:inline-block;background-color:" + accentColor + ";" +
                "                  border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;" +
                "                  font-size:24px;color:#ffffff;font-weight:700;\">Q</div>" +
                "      <h1 style=\"margin:12px 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;" +
                "                 color:" + TEXT_MUTED + ";font-weight:600;\">Queue Management System</h1>" +
                "    </td>" +
                "  </tr>" +
                "  </table>" +
                "</td></tr>" +

                "<tr><td style=\"padding:24px 40px 0;\">" +
                "  <div style=\"height:1px;background-color:" + DIVIDER + ";\"></div>" +
                "</td></tr>" +
                "<tr><td style=\"padding:32px 40px;\">" +
                cardBody +
                "</td></tr>" +

                "<tr><td style=\"background-color:" + BG_PAGE + ";padding:20px 40px;border-radius:0 0 12px 12px;\">" +
                "  <p style=\"margin:0;font-size:12px;color:" + TEXT_MUTED + ";text-align:center;line-height:1.6;\">" +
                "    This is an automated message from QMS &mdash; please do not reply.<br/>" +
                "    &copy; 2026 QMS Interview System. All rights reserved." +
                "  </p>" +
                "</td></tr>" +

                "</table>" +
                "</td></tr>" +
                "</table>" +
                "</body></html>";
    }

    private String tokenBadge(String tokenId, String bgColor, String textColor, String labelColor) {
        return "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">" +
                "<tr><td align=\"center\" style=\"padding:20px 0;\">" +
                "  <div style=\"display:inline-block;background-color:" + bgColor + ";" +
                "              border-radius:10px;padding:20px 36px;text-align:center;" +
                "              border:1px solid " + textColor + "22;\">" +
                "    <p style=\"margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:2px;" +
                "               color:" + labelColor + ";font-weight:600;\">Token ID</p>" +
                "    <p style=\"margin:0;font-size:30px;font-weight:800;color:" + textColor + ";" +
                "               letter-spacing:3px;font-family:'Courier New',monospace;\">" + tokenId + "</p>" +
                "  </div>" +
                "</td></tr>" +
                "</table>";
    }

    private String infoRow(String label, String value, String accentColor) {
        return "<tr>" +
                "  <td style=\"padding:10px 0;border-bottom:1px solid " + DIVIDER + ";\">" +
                "    <p style=\"margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;" +
                "               color:" + TEXT_MUTED + ";font-weight:600;\">" + label + "</p>" +
                "    <p style=\"margin:4px 0 0;font-size:16px;font-weight:700;color:" + accentColor + ";\">" + value
                + "</p>" +
                "  </td>" +
                "</tr>";
    }

    @Override
    public String buildRegistrationEmail(String candidateName,
            String tokenId,
            int queuePosition,
            int candidatesAhead,
            int estimatedWait) {

        String waitText = estimatedWait == 0
                ? "You're up next!"
                : "approximately " + estimatedWait + " minute" + (estimatedWait == 1 ? "" : "s");

        String body = "<h2 style=\"margin:0 0 8px;font-size:24px;font-weight:800;color:" + TEXT_MAIN + ";\">" +
                "  Registration Confirmed &#127881;" +
                "</h2>" +
                "<p style=\"margin:0 0 24px;font-size:15px;color:" + TEXT_MUTED + ";line-height:1.6;\">" +
                "  Hello <strong style=\"color:" + TEXT_MAIN + ";\">" + candidateName + "</strong>, " +
                "  you have been successfully registered for today's interview. " +
                "  Please keep this email handy &mdash; your token details are below." +
                "</p>" +

                tokenBadge(tokenId, TEAL_LIGHT, TEAL_DARK, TEAL_MID) +

                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin-top:8px;\">" +
                infoRow("Queue Position", "#" + queuePosition, TEAL_MID) +
                infoRow("Candidates Ahead", String.valueOf(candidatesAhead), TEXT_MAIN) +
                infoRow("Estimated Wait", waitText, TEAL_MID) +
                "</table>" +

                "<div style=\"margin-top:28px;background-color:" + TEAL_LIGHT + ";border-left:4px solid " + TEAL_MID
                + ";" +
                "             border-radius:6px;padding:16px 20px;\">" +
                "  <p style=\"margin:0 0 8px;font-size:13px;font-weight:700;color:" + TEAL_DARK
                + ";\">&#128161; What to do next</p>" +
                "  <ul style=\"margin:0;padding-left:18px;font-size:13px;color:" + TEAL_DARK + ";line-height:1.8;\">" +
                "    <li>Stay nearby &mdash; you will receive another email when it is your turn.</li>" +
                "    <li>Carry a copy of your updated resume.</li>" +
                "    <li>Please arrive at the reception <strong>promptly</strong> when called.</li>" +
                "  </ul>" +
                "</div>" +

                "<p style=\"margin:28px 0 0;font-size:15px;color:" + TEXT_MAIN + ";line-height:1.6;\">" +
                "  We wish you the very best of luck! &#127775;" +
                "</p>" +
                "<p style=\"margin:4px 0 0;font-size:14px;color:" + TEXT_MUTED + ";\">" +
                "  &mdash; <strong>QMS Interview Team</strong>" +
                "</p>";

        return wrap(TEAL_MID, body);
    }

    @Override
    public String buildCallNowEmail(String candidateName, String tokenId, String cabinName) {

        String body = "<h2 style=\"margin:0 0 8px;font-size:24px;font-weight:800;color:" + TEXT_MAIN + ";\">" +
                "  It&rsquo;s Your Turn! &#127919;" +
                "</h2>" +
                "<p style=\"margin:0 0 24px;font-size:15px;color:" + TEXT_MUTED + ";line-height:1.6;\">" +
                "  Hello <strong style=\"color:" + TEXT_MAIN + ";\">" + candidateName + "</strong>, " +
                "  your interview is starting now. Please proceed <strong>immediately</strong> to your assigned cabin."
                +
                "</p>" +

                tokenBadge(tokenId, TEAL_LIGHT, TEAL_DARK, TEAL_MID) +

                "<div style=\"margin:8px 0 24px;background-color:" + TEAL_MID + ";" +
                "             border-radius:10px;padding:20px;text-align:center;\">" +
                "  <p style=\"margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;" +
                "             color:#ffffff99;font-weight:600;\">Proceed to Cabin</p>" +
                "  <p style=\"margin:0;font-size:26px;font-weight:800;color:#ffffff;\">" + cabinName + "</p>" +
                "</div>" +

                "<div style=\"background-color:#fef9c3;border-left:4px solid #ca8a04;" +
                "             border-radius:6px;padding:14px 20px;\">" +
                "  <p style=\"margin:0;font-size:13px;color:#78350f;line-height:1.6;\">" +
                "    &#9888;&#65039; <strong>Important:</strong> If you do not appear within a reasonable time, " +
                "    your token may be marked as <em>No Show</em> and you will lose your position in the queue." +
                "  </p>" +
                "</div>" +

                "<p style=\"margin:28px 0 0;font-size:15px;color:" + TEXT_MAIN + ";line-height:1.6;\">" +
                "  The interviewer is ready for you &mdash; good luck! &#128640;" +
                "</p>" +
                "<p style=\"margin:4px 0 0;font-size:14px;color:" + TEXT_MUTED + ";\">" +
                "  &mdash; <strong>QMS Interview Team</strong>" +
                "</p>";

        return wrap(TEAL_MID, body);
    }

    @Override
    public String buildYouAreNextEmail(String candidateName, String tokenId) {

        String body = "<h2 style=\"margin:0 0 8px;font-size:24px;font-weight:800;color:" + TEXT_MAIN + ";\">" +
                "  You&rsquo;re Up Next! &#9203;" +
                "</h2>" +
                "<p style=\"margin:0 0 24px;font-size:15px;color:" + TEXT_MUTED + ";line-height:1.6;\">" +
                "  Hello <strong style=\"color:" + TEXT_MAIN + ";\">" + candidateName + "</strong>, " +
                "  you are <strong>next in line</strong> for your interview. " +
                "  Please be ready &mdash; you will be called very soon." +
                "</p>" +

                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">" +
                "<tr><td align=\"center\" style=\"padding:20px 0;\">" +
                "  <div style=\"display:inline-block;background-color:" + AMBER_LIGHT + ";" +
                "              border-radius:10px;padding:20px 36px;text-align:center;" +
                "              border:1px solid " + AMBER_MID + "44;\">" +
                "    <p style=\"margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:2px;" +
                "               color:" + AMBER_MID + ";font-weight:600;\">Your Token</p>" +
                "    <p style=\"margin:0;font-size:30px;font-weight:800;color:" + AMBER_DARK + ";" +
                "               letter-spacing:3px;font-family:'Courier New',monospace;\">" + tokenId + "</p>" +
                "  </div>" +
                "</td></tr>" +
                "</table>" +

                "<div style=\"background-color:" + AMBER_LIGHT + ";border-left:4px solid " + AMBER_MID + ";" +
                "             border-radius:6px;padding:16px 20px;margin-top:8px;\">" +
                "  <p style=\"margin:0 0 8px;font-size:13px;font-weight:700;color:" + AMBER_DARK
                + ";\">&#128203; Quick Checklist</p>" +
                "  <ul style=\"margin:0;padding-left:18px;font-size:13px;color:" + AMBER_DARK + ";line-height:1.8;\">" +
                "    <li>Stay close to the reception / waiting area.</li>" +
                "    <li>Keep your resume and any documents ready.</li>" +
                "    <li>You will receive another email the moment you are called.</li>" +
                "  </ul>" +
                "</div>" +

                "<p style=\"margin:28px 0 0;font-size:15px;color:" + TEXT_MAIN + ";line-height:1.6;\">" +
                "  Stay focused and confident &mdash; you&rsquo;ve got this! &#129305;" +
                "</p>" +
                "<p style=\"margin:4px 0 0;font-size:14px;color:" + TEXT_MUTED + ";\">" +
                "  &mdash; <strong>QMS Interview Team</strong>" +
                "</p>";

        return wrap(AMBER_MID, body);
    }
}
