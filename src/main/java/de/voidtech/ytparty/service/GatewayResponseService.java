package main.java.de.voidtech.ytparty.service;

import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;

import main.java.de.voidtech.ytparty.entities.ephemeral.GatewayConnection;
import main.java.de.voidtech.ytparty.entities.ephemeral.Party;
import main.java.de.voidtech.ytparty.entities.message.MessageBuilder;
import main.java.de.voidtech.ytparty.entities.message.SystemMessage;
import main.java.de.voidtech.ytparty.entities.persistent.ChatMessage;

@Service
public class GatewayResponseService {
	
	@Autowired
	private ChatMessageService messageService;
	
	private static final Logger LOGGER = Logger.getLogger(GatewayResponseService.class.getName());

	public void sendError(GatewayConnection session, String error, String origin) {
		try {
			session.getSession().sendMessage(new TextMessage(new JSONObject()
					.put("success", false)
					.put("response", error)
					.put("type", origin)
					.toString()));
		} catch (JSONException | IOException e) {
			LOGGER.log(Level.SEVERE, "Error during Service Execution: " + e.getMessage());
		}
	}
	
	public void sendSuccess(GatewayConnection session, JSONObject message, String origin) {
		try {
			session.getSession().sendMessage(new TextMessage(new JSONObject()
					.put("success", true)
					.put("response", message)
					.put("type", origin)
					.toString()));
		} catch (JSONException | IOException e) {
			LOGGER.log(Level.SEVERE, "Error during Service Execution: " + e.getMessage());
		}
	}
	
	public void sendChatMessage(Party party, ChatMessage message) {
		party.broadcastMessage(message);
		messageService.saveMessage(message);
	}
	
	public void sendSystemMessage(Party party, SystemMessage systemMessage) {
		party.broadcastMessage(systemMessage);
	}
	
	public void sendChatHistory(GatewayConnection session, List<ChatMessage> history) {
		try {
			for (ChatMessage message : history) {
				session.getSession().sendMessage(new TextMessage(message.convertToJson()));
			}
		} catch (IOException e) {
			LOGGER.log(Level.SEVERE, "Error during Service Execution: " + e.getMessage()); 
		}
		sendSuccess(session, MessageBuilder.EMPTY_JSON, "party-partyready");
	}
}