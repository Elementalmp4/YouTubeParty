package main.java.de.voidtech.ytparty.service;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.voidtech.ytparty.handlers.AbstractHandler;

@Service
public class MessageHandler {

	@Autowired
	private List<AbstractHandler> handlers;
	
	@Autowired
	private GatewayResponseService responder;
	
	private static final Logger LOGGER = Logger.getLogger(MessageHandler.class.getName());
	
	public void handleMessage(WebSocketSession session, String message) {
		try {
			JSONObject messageObject = new JSONObject(message);
			if (!messageObject.has("type") || !messageObject.has("data")) {
				responder.sendError(session, "Invalid message format", "gateway");
				return;
			}
				
			List<AbstractHandler> compatibleHandlers = handlers.stream()
					.filter(handler -> handler.getHandlerType().equals(messageObject.get("type")))
					.collect(Collectors.toList());
			
			if (!compatibleHandlers.isEmpty()) {
				AbstractHandler compatibleHandler = compatibleHandlers.get(0);
				LOGGER.log(Level.INFO, "Received Gateway Message: " + messageObject.getString("type"));
				compatibleHandler.execute(session, messageObject.getJSONObject("data"));			
			} else responder.sendError(session, "Invalid message type", "gateway");
		} catch (JSONException e) {
			responder.sendError(session, "Invalid message format", "JSON formatter");
			LOGGER.log(Level.SEVERE, "Error during Service Execution: " + e.getMessage());
		}
	}	
}