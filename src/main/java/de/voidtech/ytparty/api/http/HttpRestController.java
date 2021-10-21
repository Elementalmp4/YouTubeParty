package main.java.de.voidtech.ytparty.api.http;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import main.java.de.voidtech.ytparty.service.FileReader;

@RestController
public class HttpRestController {
	
	@Autowired
	private FileReader fileReader;

	@RequestMapping(value = "/")
	public String indexRoute() {
		return fileReader.getTextFileContents("html/index.html");
	}
	
	@RequestMapping(value = "/terms.html")
	public String termsRoute() {
		return fileReader.getTextFileContents("html/terms.html");
	}
  
	@RequestMapping(value = "/primarystyle.css")
	public String primaryStyleRoute() {
		return fileReader.getTextFileContents("css/primarystyle.css");
	}
	
	@RequestMapping(value = "/playerstyle.css")
	public String playerStyleRoute() {
		return fileReader.getTextFileContents("css/playerstyle.css");
	}
	
	@RequestMapping(value = "/player.html")
	public String playerRoute() {
		return fileReader.getTextFileContents("html/player.html");
	}
	
	@RequestMapping(value = "/player.js")
	public String playerScriptRoute() {
		return fileReader.getTextFileContents("js/player.js");
	}
	
	@RequestMapping(value = "/favicon.png", produces = {"image/png"})
	public byte[] faviconRoute() {
		return fileReader.getBinaryFileContents("img/favicon.png");
	}
	
	@RequestMapping(value = "/waves.svg", produces = {"image/svg+xml"})
	public byte[] wavesRoute() {
		return fileReader.getBinaryFileContents("img/waves.svg");
	}
	
	@RequestMapping(value = "/deadcat.gif", produces = {"image/gif"})
	public byte[] catGifRoute() {
		return fileReader.getBinaryFileContents("img/deadcat.gif");
	}
	
	@RequestMapping(value = "/login.html")
	public String loginRoute() {
		return fileReader.getTextFileContents("html/login.html");
	}
	
	@RequestMapping(value = "/signup.html")
	public String signupRoute() {
		return fileReader.getTextFileContents("html/signup.html");
	}
	
	@RequestMapping(value = "/about.html")
	public String aboutRoute() {
		return fileReader.getTextFileContents("html/about.html");
	}
	
	@RequestMapping(value = "/signup.js")
	public String signupScriptRoute() {
		return fileReader.getTextFileContents("js/signup.js");
	}

	@RequestMapping(value = "/login.js")
	public String signInScriptRoute() {
		return fileReader.getTextFileContents("js/login.js");
	}
	
	@RequestMapping(value = "/accountsettings.html")
	public String accountRoute() {
		return fileReader.getTextFileContents("html/accountsettings.html");
	}
	
	@RequestMapping(value = "/settings.js")
	public String settingsScriptRoute() {
		return fileReader.getTextFileContents("js/settings.js");
	}
	
	@RequestMapping(value = "/home.html")
	public String homeRoute() {
		return fileReader.getTextFileContents("html/home.html");
	}
	
	@RequestMapping(value = "/createroom.js")
	public String createRoomScriptRoute() {
		return fileReader.getTextFileContents("js/createroom.js");
	}
	
	@RequestMapping(value = "/createroom.html")
	public String createRoomRoute() {
		return fileReader.getTextFileContents("html/createroom.html");
	}
	
	@RequestMapping(value = "/joinroom.js")
	public String joinRoomScriptRoute() {
		return fileReader.getTextFileContents("js/joinroom.js");
	}
	
	@RequestMapping(value = "/joinroom.html")
	public String joinRoomRoute() {
		return fileReader.getTextFileContents("html/joinroom.html");
	}
	
	@RequestMapping(value = "/doesonestillequalone.html")
	public String easterEggRoute() {
		return fileReader.getTextFileContents("/html/doesonestillequalone.html");
	}
	
	@RequestMapping(value = "/resetpassword.html")
	public String passwordResetRoute() {
		return fileReader.getTextFileContents("/html/resetpassword.html");
	}
	
	@RequestMapping(value = "/forgotpassword.html")
	public String forgotPasswordRoute() {
		return fileReader.getTextFileContents("/html/forgotpassword.html");
	}
	
	@RequestMapping(value = "/resetpassword.js")
	public String passwordResetScriptRoute() {
		return fileReader.getTextFileContents("/js/resetpassword.js");
	}
	
	@RequestMapping(value = "/forgotpassword.js")
	public String forgotPasswordScriptRoute() {
		return fileReader.getTextFileContents("/js/forgotpassword.js");
	}
}