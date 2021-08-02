package main.java.de.voidtech.ytparty.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import main.java.de.voidtech.ytparty.entities.Party;

@Service
public class PartyService {
	
	private static final List<String> LEXICON = Arrays.asList("ABCDEFGHIJKLMNOPQRSTUVWXYZ12345674890".split(""));
	private HashMap<String, Party> parties = new HashMap<String, Party>();  
	
	@Autowired
	private SessionFactory sessionFactory;
	
	@EventListener(ApplicationReadyEvent.class)
	private void cleanDatabase() {
		try(Session session = sessionFactory.openSession())	{
			session.getTransaction().begin();
			session.createQuery("DELETE FROM Messages")
				.executeUpdate();
			session.getTransaction().commit();
		}
	}
	
	public String generateRoomID() {
		String ID = "";
		Random random = new Random();
		for (int i = 0; i < 8; i++) ID += LEXICON.get(random.nextInt(LEXICON.size() - 1));
		return ID;
	}
	
	public synchronized Party getParty(String partyID) {
		return parties.get(partyID);
	}
	
	public synchronized void saveParty(Party party) {
		parties.put(party.getPartyID(), party);
	}
	
	public synchronized void deleteParty(String partyID) {
		parties.remove(partyID);
	}
	
	public synchronized void removeSessionFromParty(WebSocketSession session) {
		List<String> invalidParties = new ArrayList<String>();
		for (String key : parties.keySet()) { 
			Party party = parties.get(key);
			party.checkRemoveSession(session);
			if (party.getAllSessions().isEmpty() && party.hasBeenVisited()) invalidParties.add(key);
		}
		if (!invalidParties.isEmpty()) for (String key : invalidParties) parties.remove(key);
	}
}