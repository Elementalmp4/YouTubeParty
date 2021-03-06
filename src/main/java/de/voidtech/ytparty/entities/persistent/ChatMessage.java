package main.java.de.voidtech.ytparty.entities.persistent;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Table;

import org.hibernate.annotations.Type;
import org.json.JSONObject;

import main.java.de.voidtech.ytparty.entities.message.MessageBuilder;

@Entity(name = "Messages")
@Table(name = "Messages", indexes = @Index(columnList = "partyID", name = "index_message"))
//Create an index for this table, indexed by party ID to increase searching efficiency
public class ChatMessage {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private long id;
	
	@Column
	private String partyID; 
	
	@Column
	private String author;
	
	@Column
	private String colour;
	
	@Column
	@Type(type = "org.hibernate.type.TextType")
	//Set the message content type to Text. this removes the character limit so we can set our own
	private String content;
	
	@Column
	private String messageModifiers;
	
	@Column
	private String avatar;
	
	@Deprecated
	ChatMessage() {
	}
	
	public ChatMessage(MessageBuilder builder) //Take a message builder as an argument
	{
	  //Take all the necessary fields from the builder
	  this.partyID = builder.getChatMessagePartyID();
	  this.author = builder.getChatMessageAuthor();
	  this.colour = builder.getChatMessageColour();
	  this.content = builder.getChatMessageContent();
	  this.messageModifiers = builder.getChatMessageMessageModifiers();
	  this.avatar = builder.getChatMessageAvatar();
	}

	public String convertToJson() { //Create a JSON representation of this entity
		JSONObject data = new JSONObject().put("type", "party-chatmessage") //Set the gateway message type
				.put("data", new JSONObject() //Set the gateway message data
						.put("author", this.author)
						.put("colour", this.colour)
						.put("content", this.content)
						.put("avatar", this.avatar)
						.put("modifiers", this.messageModifiers));
		return data.toString(); //Convert it to a String before sending
	}
}