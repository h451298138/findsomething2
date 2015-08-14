// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
AV.Cloud.define("good", function(request, response) {
  var str = request.params.coder + " is good " + request.params.person + " is also good";
  response.success(str);
});

AV.Cloud.define("getTime", function(request, response) {
  
  var date = new Date();  
  var year = date.getFullYear();//Äê
  var month = date.getMonth() + 1;//ÔÂ
  var day = date.getDate();	 //ÈÕ  
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();
  //ÔÂ·ÝÐ¡ÓÚ10Ê±ÏÔÊ¾Îª'0X'
  if (month < 10) {
  month = "0" + month;
  }

  //ÌìÊýÐ¡ÓÚ10Ê±ÏÔÊ¾Îª'0X'
  if (day < 10) {
  day = "0" + day;
  }

  //Ð¡Ê±Ð¡ÓÚ10Ê±ÏÔÊ¾Îª'0X'
  if (hour < 10) {
  hour = "0" + hour;
  }

  //·ÖÖÓÐ¡ÓÚ10Ê±ÏÔÊ¾Îª'0X'
  if (minute < 10) {
  minute = "0" + minute;
 }

  //ÃëÖÓÐ¡ÓÚ10Ê±ÏÔÊ¾Îª'0X'
  if (second < 10) {
  second = "0" + second;
 }

  var colon = ":";
  var str = "serverTime " + year + colon + month + colon + day + colon + hour + colon +minute + colon + second;
  response.success(str);
});


AV.Cloud.define("getReward", function(request, response) {  
  var GameScore = AV.Object.extend("Reward");
  var query = new AV.Query(GameScore);
  query.equalTo("code", request.params.code);
  query.find({
    success: function(results) {
     if( results.length > 0 )
     {
        var object = results[0];
        response.success("rewardType:"+object.get('rewardType'));
        object.destroy();
     }
	 else
	 {
		response.success("can't find code");
	 }
     //
    },
    error: function() {
      response.success("can't find code");
    }
  });
});

AV.Cloud.define("getFriendList", function(request, response) {
	var accessToken = request.params.accessToken;
	var uid = request.params.uid;
	var socialType = request.params.socialType;
	AV.Cloud.httpRequest({
	  url: 'https://api.weibo.com/2/friendships/friends/ids.json',
	  params: {
		access_token : accessToken,
		uid : uid
	  },
	  success: function(httpResponse) {
		//console.log(httpResponse.text);
		var objs = eval("(" + httpResponse.text + ")");
		var tempArray = objs.ids;
		var idArray = new Array();
		for ( var i=0 ; i < tempArray.length ; ++i ) 
		{
			var id = tempArray[i].toString();
			//console.log("friend: "+ id);
			var gameData = AV.Object.extend("SocialGameData");
			var query = new AV.Query(gameData);
			query.equalTo("uid", id);
			query.find({
				success: function(results) {
				//add friend who play this game
					if(results.length == 0)
					{
						//console.log("not game friend: " + id);
					}else
					{
						for (var i = 0; i < results.length; i++) {
							var friendId = results[i].get("uid");
							//console.log("add friend: "+ friendId);
							idArray.push(friendId);
						}
					}
				},
				error: function(error) {
				// The object was not retrieved successfully.
						console.log("error: ");
				}
			});
		}
		//var idArray = tempArray;

		//console.log(idArray);
		var FriendList = AV.Object.extend("SocialFriendList");
		var query = new AV.Query(FriendList);
		query.equalTo("uid", uid);
		query.find({
		  success: function(results) {
			// The object was retrieved successfully.
			//console.log("Successfully retrieved :" + results.length);
			
			if(results.length == 0)
			{
				//create new data
				//console.log("create new data");
				var FriendList = AV.Object.extend("SocialFriendList");
				var friendList = new FriendList();
				friendList.set("SocialType",socialType);
				friendList.set("uid",uid);
				friendList.set("FriendList",idArray);
				friendList.save(null, {
				  success: function(friendList) {
					// Execute any logic that should take place after the object is saved.
					//console.log('New object created with objectId: ' + friendList.id);
					response.success(idArray);
				  },
				  error: function(friendList, error) {
					// Execute any logic that should take place if the save fails.
					// error is a AV.Error with an error code and description.
					//console.log('Failed to create new object, with error code: ' + error.description);
					response.success('Failed to create new object, with error code: ' + error.description);
				  }
				});
			}else
			{
				//update data
				for (var i = 0; i < results.length; i++) {
					var friendList = results[i];
					//console.log("update data");
					friendList.save(null, {
						  success: function(friendList) {
							// Execute any logic that should take place after the object is saved.
							response.success(idArray);
							friendList.set("FriendList",idArray);
							friendList.save();
						  },
						  error: function(friendList, error) {
							response.success('Failed to update' + error.description);
						  }
						});
					}
				}			
		  },
		  error: function(error) {
			// The object was not retrieved successfully.
			// error is a AV.Error with an error code and description.
			//console.log("Error: " + error.code + " " + error.message);
			response.success("Error: " + error.code + " " + error.message);

		  }
		});
	  },
	  error: function(httpResponse) {
		console.error('Request failed with response code ' + httpResponse.status);
		response.success('Request failed with response code ' + httpResponse.status);
	  }
	});
});


AV.Cloud.define("saveSocialGameData", function(request, response) {
	var accessToken = request.params.accessToken;
	var uid = request.params.uid;
    var playerLevel = request.params.playerLevel;
    var endlessScore = request.params.endlessScore;
    var stateInfo = request.params.stateInfo;
	var socialType = request.params.socialType;
         
	var WeiboInfoReqUrl = "https://api.weibo.com/2/users/show.json";

	AV.Cloud.httpRequest({
		  url: WeiboInfoReqUrl,
		  params: {
			access_token : accessToken,
			uid : uid
		  },
		  success: function(httpResponse) {
			//console.log(httpResponse.text);
			var objs = eval("(" + httpResponse.text + ")");
			var socialName = objs.screen_name;
			var socialImgUrl = objs.profile_image_url;
			var giftFromFriend = new Array();

			//console.log(idArray);
			var socialData = AV.Object.extend("SocialGameData");
			var query = new AV.Query(socialData);
			query.equalTo("uid", uid);
			query.find({
			  success: function(results) {
				// The object was retrieved successfully.
				//console.log("Successfully retrieved :" + results.length);
				
				if(results.length == 0)
				{
					//create new data
					console.log("create new data");
					var SocialGameData = AV.Object.extend("SocialGameData");
					var socialGameData = new SocialGameData();
					socialGameData.set("SocialType",socialType);
					socialGameData.set("uid",uid);
					socialGameData.set("PlayerName",socialName);
					socialGameData.set("ImgUrl",socialImgUrl);
					socialGameData.set("StateInfo",stateInfo);
					socialGameData.set("PlayerLevel",playerLevel);
					socialGameData.set("EndlessScore",endlessScore);
					socialGameData.set("giftFromFriend",giftFromFriend);
					socialGameData.set("unreceivedChipNum",0);
					socialGameData.save(null, {
					  success: function(socialGameData) {
						// Execute any logic that should take place after the object is saved.
						//console.log('New object created with objectId: ' + friendList.id);
						response.success("{\"socialName\":"+socialName+",\"socialImgUrl\""+socialImgUrl+"}");
					  },
					  error: function(socialGameData, error) {
						// Execute any logic that should take place if the save fails.
						// error is a AV.Error with an error code and description.
						//console.log('Failed to create new object, with error code: ' + error.description);
						response.success('Failed to create new object, with error code: ' + error.description);
					  }
					});
				}else
				{
					//update data
					for (var i = 0; i < results.length; i++) {
						var socialGameData = results[i];
						//console.log("update data");
						socialGameData.save(null, {
							  success: function(socialGameData) {
								// Execute any logic that should take place after the object is saved.
								socialGameData.set("SocialType",socialType);
								socialGameData.set("PlayerName",socialName);
								socialGameData.set("ImgUrl",socialImgUrl);
								socialGameData.set("StateInfo",stateInfo);
								socialGameData.set("PlayerLevel",playerLevel);
								socialGameData.set("EndlessScore",endlessScore);
								socialGameData.save();
								response.success("{\"socialName\":\""+socialName+"\",\"socialImgUrl\":\""+socialImgUrl+"\"}");
							  },
							  error: function(socialGameData, error) {
								response.success('Failed to update' + error.description);
							  }
						});
					}
				}
				
			  },
			  error: function(error) {
				// The object was not retrieved successfully.
				// error is a AV.Error with an error code and description.
				//console.log("Error: " + error.code + " " + error.message);
				response.success("Error: " + error.code + " " + error.message);
			  }
			});

		  },
		  error: function(httpResponse) {
			console.error('Request failed with response code ' + httpResponse.status);
			response.success('Request failed with response code ' + httpResponse.status);
		  }
		});
});

AV.Cloud.define("getFriendMapData", function(request, response) {
	console.log("getFriendMapData");
	var friendId = request.params.friendId;
	var bigLevel = request.params.bigLevel;
	var jsonArray = new Array();

	var socialData = AV.Object.extend("SocialGameData");
			var query = new AV.Query(socialData);
			query.equalTo("uid", friendId);
			query.find({
			  success: function(results) {
				// The object was retrieved successfully.
				//console.log("Successfully retrieved :" + results.length);
				
				if(results.length == 0)
				{
					response.success("");
				}else
				{
					for (var i = 0; i < results.length; i++) {
						var socialGameData = results[i];
						var stateInfo = socialGameData.get("StateInfo");
						var strs= new Array();
						strs=stateInfo.split("_");
						var bLev = strs[0];
						var sLev = strs[1];
						if (bLev == bigLevel)
						{
							var friendName = socialGameData.get("PlayerName");
							var friendImgUrl = socialGameData.get("ImgUrl");
							jsonArray[i] = "{\"friendName\":\""+friendName+"\",\"friendImgUrl\":\""+friendImgUrl+"\",\"friendBigLevel\":"+bLev+",\"friendSmallLevel\":"+sLev+"}";
						}else
						{
							response.success("");
						}
					}
					if (i == results.length)
					{
						response.success(jsonArray);
					}
				}
				
			  },
			  error: function(error) {
				// The object was not retrieved successfully.
				// error is a AV.Error with an error code and description.
				//console.log("Error: " + error.code + " " + error.message);
				response.success("Error: " + error.code + " " + error.message);
			  }
			});

});



AV.Cloud.define("getFriendStateRankData", function(request, response) 
{
	var friendList = request.params.friendList;
	var selfId = request.params.selfId;
	friendList.push(selfId);
	var socialData = AV.Object.extend("SocialGameData");
	var query = new AV.Query(socialData);
	var jsonArray = new Array();
	//console.log("friendList2:"+friendList);
	query.containedIn("uid",friendList);
	query.descending("StateInfo");
	query.find
	({
	  success: function(results) {
		// Successfully retrieved the object.
		for (var i = 0; i < results.length; i++) {
			var socialGameData = results[i];
			var friendId = socialGameData.get("uid");
			var friendName = socialGameData.get("PlayerName");
			var friendLevel = socialGameData.get("PlayerLevel");
			var stateInfo = socialGameData.get("StateInfo");
			var strs= new Array();
			strs=stateInfo.split("_");
			var bLev = strs[0];
			var sLev = strs[1];

			jsonArray[i] = "{\"friendName\":\""+friendName+"\",\"friendId\":\""+friendId+"\",\"friendLevel\":"+friendLevel+",\"friendBigLevel\":"+bLev+",\"friendSmallLevel\":"+sLev+"}";
		}
		if (i == results.length)
		{
			response.success(jsonArray);
		}
	  },
	  error: function(error) {
		alert("Error: " + error.code + " " + error.message);
	  }
	});
});

AV.Cloud.define("getFriendEndRankData", function(request, response) {
	var friendList = request.params.friendList;
	//console.log("friendList1:"+friendList);
	var selfId = request.params.selfId;
	friendList.push(selfId);
	var socialData = AV.Object.extend("SocialGameData");
	var query = new AV.Query(socialData);
	var jsonArray = new Array();
	//console.log("friendList2:"+friendList);
	query.containedIn("uid",friendList);
	query.descending("EndlessScore");
	query.find({
	  success: function(results) {
		// Successfully retrieved the object.
		for (var i = 0; i < results.length; i++) {
			var socialGameData = results[i];
			var friendId = socialGameData.get("uid");
			var friendName = socialGameData.get("PlayerName");
			var friendLevel = socialGameData.get("PlayerLevel");
			var endlessScore = socialGameData.get("EndlessScore");

			jsonArray[i] = "{\"friendName\":\""+friendName+"\",\"friendId\":\""+friendId+"\",\"friendLevel\":"+friendLevel+",\"endlessScore\":"+endlessScore+"}";
		}
		if (i == results.length)
		{
			response.success(jsonArray);
		}
	  },
	  error: function(error) {
		alert("Error: " + error.code + " " + error.message);
	  }
	});
});

AV.Cloud.define("sendGiftToFriend", function(request, response) {
	console.log("sendGiftToFriend");
	var friendId = request.params.friendId;
	var selfId = request.params.selfId;
	console.log("friendId:"+friendId+"selfId"+selfId);
	var chipNum = Math.floor(Math.random()*4+6); //6-10
	var socialData = AV.Object.extend("SocialGameData");
	var query = new AV.Query(socialData);
	var avatarUrl = "";


	query.equalTo("uid", selfId);
			query.find({
			  success: function(results) {
	console.log("sendGiftToFriend selfId results:"+results);
				if(results.length == 0)
				{
					response.success("");
				}else
				{
					for (var i = 0; i < results.length; i++) {
						var socialGameData = results[i];
						avatarUrl = socialGameData.get("ImgUrl");
					}
				}
				
			  },
			  error: function(error) {
				response.success("Error: " + error.code + " " + error.message);
			  }
			});

			query.equalTo("uid", friendId);
			query.find({
			  success: function(results) {
				console.log("sendGiftToFriend friendId results:"+results);
				if(results.length == 0)
				{
					response.success("");
				}else
				{
					for (var i = 0; i < results.length; i++) {
						var socialGameData = results[i];
						console.log("sendGiftToFriend friendId socialGameData:"+socialGameData);
						var nowChipNum = socialGameData.get("unreceivedChipNum") + chipNum;
						var date = new Date();


						var giftFromFriend = socialGameData.get("giftFromFriend");
						console.log("sendGiftToFriend giftFromFriend:"+giftFromFriend);
						if (giftFromFriend != "")
						{
								for(var j = 0; j < giftFromFriend.length ; ++j)
								{
									var jsonData = eval("(" + giftFromFriend[j] + ")");  
									if(jsonData.fromId == selfId)
									{
										response.success("can`t send!");
									}else
									{
										socialGameData.save(null, {
										  success: function(socialGameData) {
											// Execute any logic that should take place after the object is saved.
											response.success("chipNum update");
											console.log("chipNum update");
											var jsonData = "{\"fromId\":\""+selfId+"\",\"fromImgUrl\":\""+avatarUrl+"\",\"chipNum\":"+chipNum+",\"date\":\""+date+"\"}";
											socialGameData.addUnique("giftFromFriend",jsonData);
											socialGameData.set("unreceivedChipNum",nowChipNum);
											socialGameData.save();
										  },
										  error: function(socialGameData, error) {
											response.success('Failed to update' + error.description);
										  }
										});
									}
								}
						}else
						{
							socialGameData.save(null, {
										  success: function(socialGameData) {
											// Execute any logic that should take place after the object is saved.
											response.success("chipNum update");
											console.log("chipNum update");
											var jsonData = "{\"fromId\":\""+selfId+"\",\"fromImgUrl\":\""+avatarUrl+"\",\"chipNum\":"+chipNum+",\"date\":\""+date+"\"}";
											socialGameData.addUnique("giftFromFriend",jsonData);
											socialGameData.set("unreceivedChipNum",nowChipNum);
											socialGameData.save();
										  },
										  error: function(socialGameData, error) {
											response.success('Failed to update' + error.description);
										  }
										});
						}		
					}
				}
				
			  },
			  error: function(error) {
				response.success("Error: " + error.code + " " + error.message);
			  }
			});

});

AV.Cloud.define("checkGiftList", function(request, response) {
	var selfId = request.params.selfId;
	var socialData = AV.Object.extend("SocialGameData");
	var query = new AV.Query(socialData);

	query.equalTo("uid", selfId);
			query.find({
			  success: function(results) {
				if(results.length == 0)
				{
					response.success("");
				}else
				{
					for (var i = 0; i < results.length; i++) {
						var socialGameData = results[i];
						var giftFromFriend = socialGameData.get("giftFromFriend");
						response.success(giftFromFriend);
					}
				}
				
			  },
			  error: function(error) {
				response.success("Error: " + error.code + " " + error.message);
			  }
			});
});

AV.Cloud.define("getGift", function(request, response) {
	var selfId = request.params.selfId;
	var friendId = request.params.friendId;
	var getNum = request.params.getNum;
	var socialData = AV.Object.extend("SocialGameData");
	var query = new AV.Query(socialData);

	query.equalTo("uid", selfId);
			query.find({
			  success: function(results) {
				if(results.length == 0)
				{
					response.success("");
				}else
				{
					for (var i = 0; i < results.length; i++) {
						var socialGameData = results[i];
						var unreceivedChipNum = socialGameData.get("unreceivedChipNum");
						var nowChipNum = unreceivedChipNum - getNum;
						var giftFromFriend = socialGameData.get("giftFromFriend");
 
						for(var j = 0; j < giftFromFriend.length ; ++j)
						{
							var jsonData = eval("(" + giftFromFriend[j] + ")");  
							
							if(jsonData.fromId == friendId)
							{
								socialGameData.remove("giftFromFriend",giftFromFriend[j]);
							}
						}

						if(nowChipNum >= 0)
						{
							socialGameData.save(null, {
							  success: function(socialGameData) {
								socialGameData.set("unreceivedChipNum",nowChipNum);
								socialGameData.save();
								response.success("chipNum update");
							  },
							  error: function(socialGameData, error) {
								response.success('Failed to update' + error.description);
							  }
							});
						}
					}
				}
				
			  },
			  error: function(error) {
				response.success("Error: " + error.code + " " + error.message);
			  }
			});
});


AV.Cloud.define("getUnreceivedChipNum", function(request, response) {
	var selfId = request.params.selfId;
	var socialData = AV.Object.extend("SocialGameData");
	var query = new AV.Query(socialData);

	query.equalTo("uid", selfId);
			query.find({
			  success: function(results) {
				if(results.length == 0)
				{
					response.success("");
				}else
				{
					for (var i = 0; i < results.length; i++) {
						var socialGameData = results[i];
						var nowChipNum = socialGameData.get("unreceivedChipNum");
						response.success(nowChipNum);
					}
				}			
			  },
			  error: function(error) {
				response.success("Error: " + error.code + " " + error.message);
			  }
			});
});

AV.Cloud.define("getAllGift", function(request, response) {
	var selfId = request.params.selfId;
	var socialData = AV.Object.extend("SocialGameData");
	var query = new AV.Query(socialData);

	query.equalTo("uid", selfId);
			query.find({
			  success: function(results) {
				if(results.length == 0)
				{
					response.success("");
				}else
				{
					for (var i = 0; i < results.length; i++) {
						var socialGameData = results[i];
						var nowChipNum = 0;

						var giftFromFriend = socialGameData.get("giftFromFriend");
						for(var j = 0; j < giftFromFriend.length ; ++j)
						{

							console.log("remove giftFromFriend : " + giftFromFriend[j]);
							socialGameData.remove("giftFromFriend",giftFromFriend[j]);
						}

						socialGameData.save(null, {
							 success: function(socialGameData) {
								socialGameData.set("unreceivedChipNum",nowChipNum);
								socialGameData.save();
								response.success("chipNum update");
							  },
							 error: function(socialGameData, error) {
								response.success('Failed to update' + error.description);
							  }
						});
					}
				}
				
			  },
			  error: function(error) {
				response.success("Error: " + error.code + " " + error.message);
			  }
			});
});

AV.Cloud.define("getSendLeftTime", function(request, response) {

	console.log("getSendLeftTime");
	var checkId = request.params.checkId;
	var fromId = request.params.fromId;

	var socialData = AV.Object.extend("SocialGameData");
	var query = new AV.Query(socialData);

	console.log("checkId:"+checkId);
	query.equalTo("uid", checkId);
				query.find({
				  success: function(results) {
					  console.log("getSendLeftTime results:"+results);
					if(results.length == 0)
					{
						response.success("");
					}else
					{
						for (var i = 0; i < results.length; i++) {
							var socialGameData = results[i];
							console.log("socialGameData:"+socialGameData);
							var giftFromFriend = socialGameData.get("giftFromFriend");
							console.log("giftFromFriend:"+giftFromFriend);
							if (giftFromFriend != "")
							{
								for(var j = 0; j < giftFromFriend.length ; ++j)
								{
									var jsonData = eval("(" + giftFromFriend[j] + ")");
										console.log("jsonData.date : " + jsonData.date);  
									if(jsonData.fromId == fromId)
									{
										//console.log("jsonData.date : " + jsonData.date);
										var endTime = new Date(jsonData.date);
										var nowTime = new Date();
										//console.log("sendTime : " + endTime);
										endTime = endTime.valueOf();
										endTime = endTime + 1 * 24 * 60 * 60 * 1000;
										endTime = new Date(endTime);
										//console.log("endTime : " + endTime);
										//console.log("nowTime : " + nowTime);
										var nMS = endTime.getTime() - nowTime.getTime();  
										//console.log("nMS : " + nMS);
										var nS = Math.floor(nMS/ 1000);
										if(nS < 0)
										{
											nS = 0;
										}
										var jsonData = "{\"nS\":"+nS+"}";
										response.success(jsonData);
										//response.success("friend date find");
									}
								}
							}else
							{
								response.success("friend date not exist");
							}
						
						}
					}
					
				  },
				  error: function(error) {
					response.success("Error: " + error.code + " " + error.message);
				  }
				});

});

AV.Cloud.define("setSocialData", function(request, response){
	
	//»ñÈ¡¶ÔÓ¦µÄ²ÎÊý
	var SocialID = request.params.SocialID;
	var OneDeviceID = request.params.OneDeviceID;
	var UpLoadSocialData = request.params.UpLoadSocialData;

	
	var socialTable = AV.Object.extend("SocialTable");
	var query = new AV.Query(socialTable);
	
	//²éÑ¯ÊÇ·ñÓÐ¶ÔÓ¦µÄÉç½»ID
	query.equalTo("SocialID", SocialID);
	query.find({
	
		//²éÑ¯³É¹¦
		success: function(results){
		
			//¶ÔÓ¦µÄID²»´æÔÚ
			if(results.length == 0)
			{				
				//ÐÂ½¨Ò»¸öÉç½»Êý¾Ý±í
				var SocialData = AV.Object.extend("SocialTable");
				var socialData = new SocialData();
				
				//Ìí¼Ó¶ÔÓ¦µÄÉç½»ID
				socialData.set("SocialID", SocialID);
				//ÏòDeviceIDÊý×éÖÐÌí¼ÓÒ»¸öDeviceID
				//var ID = "{\"DeviceID\":\""+OneDeviceID+"\"}";
				socialData.addUnique("DeviceID", OneDeviceID);

				//¸ù¾ÝÄÚÈÝÑ­»·Ìí¼ÓËùÉÏ´«µÄÊý¾Ý
				for(var i in UpLoadSocialData)
				{
					console.log("key" + UpLoadSocialData[i].key);
					console.log("val" + UpLoadSocialData[i].val);

					socialData.set(UpLoadSocialData[i].key, UpLoadSocialData[i].val);
				}
				
				//½«¶ÔÓ¦µÄÊý¾Ý½øÐÐ±£´æ
				socialData.save(null, {
				
					success: function(socialData){
						
						response.success("OK");
					},
					error: function(socialData, error){
						
						response.success("Err");
					}
				});				
			}
			else
			{
				//´æÔÚ¶ÔÓ¦µÄÉç½»ID
				var socialData = results[0];
				//½«¶ÔÓ¦µÄDeviceID Êý×é½øÐÐ»ñÈ¡
				var DeviceIDs = socialData.get("DeviceID");

				//ÅÐ¶Ïµ±Ç°µÄÉè±¸IDÊÇ·ñÒÑ¾­°üº¬ÔÚ¶ÔÓ¦µÄDeviceIDsÀïÃæ
				var flag = 0;
				for(var j in DeviceIDs)
				{
					if(OneDeviceID == DeviceIDs[j])
						flag = 1;
				}
				
				//ÐÂµÄDeviceID ½«Æä½øÐÐÌí¼Ó
				if(flag == 0)
				{
					//var 
					//socialData.add("DeviceID", OneDeviceID);
					socialData.addUnique("DeviceID", OneDeviceID);
				}
				
				//ÒÑ¾­´æÔÚ±íÔò£¬½«¶ÔÓ¦µÄÊý¾Ý½øÐÐ¸üÐÂ
				for(var i in UpLoadSocialData)
				{
					console.log("Key" + UpLoadSocialData[i].key);
					console.log("val" + UpLoadSocialData[i].val);
					socialData.set(UpLoadSocialData[i].key, UpLoadSocialData[i].val);
				}
				socialData.save(null, {
				
					success: function(socialData){
						
						response.success("OK");
					},
					error: function(socialData, error){
						
						response.success("Err");
					}
				});
			}
		},
		//²éÑ¯Ê§°Ü
		error: function(error){
		
			//Êä³ö´íÎóÐÅÏ¢
			response.success("Err");
		}
	});
});

AV.Cloud.define("setUserData", function(request, response){
	
	var DeviceID = request.params.DeviceID;
	var UpLoadGameData = request.params.UpLoadGameData;

	var UserTable = AV.Object.extend("UserTable");
	var query = new AV.Query(UserTable);
	
	query.equalTo("DeviceID", DeviceID);
	query.find({
	
		success: function(results){
		
			if(results.length == 0)
			{			
				console.log(results.length);

				var UserData = AV.Object.extend("UserTable");
				var userData = new UserData();

				userData.set("DeviceID",DeviceID);
				for(var i in UpLoadGameData)
				{
					console.log("key" + UpLoadGameData[i].key);
					console.log("val" + UpLoadGameData[i].val);

					userData.set(UpLoadGameData[i].key, UpLoadGameData[i].val);
				}
				
				userData.save(null, {
				
					success: function(userData){
						
						response.success("OK");
					},
					error: function(userData, error){
						
						response.success("Err");
					}
				});		
			}
			else
			{
				//ÒÑ¾­´æÔÚ±íÔò£¬½«¶ÔÓ¦µÄÊý¾Ý½øÐÐ¸üÐÂ
				var userData = results[0];
				//ÒÑ¾­´æÔÚ±íÔò£¬½«¶ÔÓ¦µÄÊý¾Ý½øÐÐ¸üÐÂ
				for(var i in UpLoadGameData)
				{
					console.log("Key" + UpLoadGameData[i].key);
					console.log("val" + UpLoadGameData[i].val);
					userData.set(UpLoadGameData[i].key, UpLoadGameData[i].val);
				}
				userData.save(null, {
				
					success: function(userData){
						
						response.success("OK");
					},
					error: function(userData, error){
						
						response.success("Err");
					}
				});	
			}
		},
		error: function(error){
		
			//Êä³ö´íÎóÐÅÏ¢
			response.success("Err");
		}
	});
});

AV.Cloud.define("getSocialData", function(request, response){

	var SocialID = request.params.SocialID;
	var DownLoadSocialData = request.params.DownLoadSocialData;

	var socialTable = AV.Object.extend("SocialTable");
	var query = new AV.Query(socialTable);

	query.equalTo("SocialID",SocialID);
	query.find({
	
		success: function(results){
		
			if(results.length == 0)
			{
				response.success("None");
			}
			else
			{
				var jsonData = "";
				socialData = results[0];

				jsonData += "{";
				for(var i in DownLoadSocialData)
				{
					if(i == 0)
					{
						jsonData += "\""+DownLoadSocialData[i].key+"\":\""+socialData.get(DownLoadSocialData[i].key)+"\"";
					}
					else
					{
						jsonData += ",\""+DownLoadSocialData[i].key+"\":\""+socialData.get(DownLoadSocialData[i].key)+"\"";
					}
				}
				jsonData += "}";

				response.success(jsonData);
			}
		},
		error: function(error){
		
			response.success("Err");	
		}
	});
});

AV.Cloud.define("getUserData", function(request, response){

	var DeviceID = request.params.DeviceID;
	var DownLoadGameData = request.params.DownLoadGameData;	

	var UserTable = AV.Object.extend("UserTable");
	var query = new AV.Query(UserTable);	

	query.equalTo("DeviceID", DeviceID);
	query.find({
	
		success: function(results){
		
			if(results.length == 0)
			{
				response.success("None");
			}
			else
			{
				var jsonData = "";

				userData = results[0];
				
				jsonData += "{";
				for(var i in DownLoadGameData)
				{
					if(i == 0)
					{
						jsonData += "\""+DownLoadGameData[i].key+"\":\""+userData.get(DownLoadGameData[i].key)+"\"";
					}
					else
					{
						jsonData += ",\""+DownLoadGameData[i].key+"\":\""+userData.get(DownLoadGameData[i].key)+"\"";
					}
				}
				jsonData += "}";

				response.success(jsonData);
			}
		},
		error: function(error){
		
			response.success("Err");
		}
	});

});

AV.Cloud.define("getFriendMapInfo", function(request, response){

	var FriendList = request.params.FriendList;
	
	if(FriendList.length == 0)
	{
		
	}
	else
	{
		//获取所有推送过来的好友链
		
		var SocialTable = AV.Object.extend("SocialTable");
		var query = new AV.Query(SocialTable);
		var curFriendList = new Array();

		for(var i in FriendList)
		{
			curFriendList.push(FriendList[i]["key"]);
		}
		
		//查询被包含的社交ID
		query.containedIn("SocialID", curFriendList);
		query.find({
		
			success: function(results)
			{
				//获取所有的SocialID
				if(results.length == 0)
				{
					response.success("Empty");
				}
				else
				{
					var SocialIDArray = new Array();
					var DeviceIDArray = new Array();
					for(var i = 0; i < results.length; i++)
					{			
						var SocialIDTable = results[i];
						var DeivceIDTable = SocialIDTable.get("DeviceID");	

						console.log("Cur Value : " +results[i]);
						console.log("Cur DeviceID : " + SocialIDTable.get("DeviceID"));		
						
						SocialIDArray.push(SocialIDTable);
						var length = 0;
						length = DeivceIDTable.length - 1;
						if(length < 0)
						{
							length = 0;
						}
						DeviceIDArray.push(DeivceIDTable[length]);

						console.log("DeviceID  c: " + DeivceIDTable[0]);
					}

					var UserTable = AV.Object.extend("UserTable");
					var queryUser = new AV.Query(UserTable);

					queryUser.containedIn("DeviceID", DeviceIDArray);	
					queryUser.find({
					
						success: function(results){
						
							if(results.length == 0)
							{}
							else
							{
								var jsonArray = new Array();								
								var strTmp = "[";

								for(var i = 0; i < results.length; i++)
								{
									var curDeviceID = results[i];
									var index = -1; 
									console.log("curDeviceID" + curDeviceID);
									console.log("My data: " + curDeviceID.get("StageName"));

									for(var j = 0; j < DeviceIDArray.length; j++)
									{
										if(DeviceIDArray[j] == curDeviceID.get("DeviceID"))
										{
											index = j;
										}
									}

									if(index != -1)
									{
										
										if(strTmp == "[")
										{
											strTmp += "{\"SocialID\":\""+SocialIDArray[index].get("SocialID")+"\",\"StageName\":\""+curDeviceID.get("StageName")+"\"}";
										}
										else 
										{
											strTmp += ",{\"SocialID\":\""+SocialIDArray[index].get("SocialID")+"\",\"StageName\":\""+curDeviceID.get("StageName")+"\"}";
										}

									}
								}
								strTmp += "]";
								response.success(strTmp);
							}
						},
						error: function(error){						
						}
					});
				}
			},
			error: function(error){}
		});
	}
});


