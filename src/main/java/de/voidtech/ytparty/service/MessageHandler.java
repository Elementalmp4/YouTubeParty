package main.java.de.voidtech.ytparty.service;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import main.java.de.voidtech.ytparty.entities.ephemeral.GatewayConnection;
import main.java.de.voidtech.ytparty.handlers.AbstractHandler;

@Service
public class MessageHandler {

	@Autowired
	private List<AbstractHandler> handlers;
	
	@Autowired
	private GatewayResponseService responder;
	
	private static final String RESPONSE_SOURCE = "Gateway";
	private static final Logger LOGGER = Logger.getLogger(MessageHandler.class.getName());
	
	public void handleMessage(GatewayConnection session, String message) {
		try {
			JSONObject messageObject = new JSONObject(message);
			if (!messageObject.has("type") || !messageObject.has("data")) {
				responder.sendError(session, "Invalid message format", RESPONSE_SOURCE); 
				return;
			}
				
			List<AbstractHandler> compatibleHandlers = handlers.stream()
					.filter(handler -> handler.getHandlerType().equals(messageObject.get("type")))
					.collect(Collectors.toList());
			
			if (compatibleHandlers.isEmpty()) {
				responder.sendError(session, "Invalid message type", RESPONSE_SOURCE);
			} else {
				AbstractHandler compatibleHandler = compatibleHandlers.get(0);
				LOGGER.log(Level.INFO, "Received Gateway Message: " + messageObject.getString("type"));
				if (compatibleHandler.requiresRateLimit()) {
					if (session.connectionRateLimited()) {
						responder.sendError(session, "You are being rate limited!", RESPONSE_SOURCE);
						return;
					}
				}
				compatibleHandler.execute(session, messageObject.getJSONObject("data"));
			}
		} catch (JSONException e) {
			responder.sendError(session, "Invalid message - " + e.getMessage(), RESPONSE_SOURCE);
			LOGGER.log(Level.SEVERE, "Error during Service Execution: " + e.getMessage());
		}
	}	
}
