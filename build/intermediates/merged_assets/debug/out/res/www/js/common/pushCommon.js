(function(window, document, M, $, undefined) {

	/**
	 * Native에서 Push 수신 시 아래 메서드로 데이터가 넘어온다.
	 * @param ns : 푸시정보
	 */
	window.onReceiveNotification = function( ns ) {
		var payload = ns.payload;
		var status = ns.status;
		var pushType = ns.type;
		var messageUID = ns.messageUID;

		if ( (typeof payload).toLowerCase() == 'string' ) {
			payload = JSON.parse(payload);
		}

		// iOS Case
		if ( !(ns.hasOwnProperty('type')) ) {
			pushType = ns['push-type'];
		}

		try {
			var title = "알림", message = "", extData = "", category = "";
			var userInfo = {
				pushType: pushType,
				status: status,
				messageUID: messageUID,
				saveTime: (+ new Date)
			};

			payload.ns = pushType;
			payload.status = status;
			payload.saveTime = (+ new Date);

			var notification = new PushNotification( payload, userInfo );

			// Read Notification
			var pushInfo = M.push.info();

			var isRichPush = false;

			M.push.remote.read({
				cuid: pushInfo.CLIENT_UID,
				notification: payload,
				onfinish: function() {

				}
			});

			// Clear Notifications
			M.push.notificationCenter.badge(0);
			M.push.notificationCenter.clear();

			message = notification.message();
			messageUID = notification.messageUniqueKey();

			var	pushPageInfo = "",
				pushMoveOption = "";

			switch(ns.extType) {
			case 'R':
				isRichPush = true;
			break;
			case 'N':
				isRichPush = false;
			break;
			case 'B':
				isRichPush = true;
				pushPageInfo = pageInfo.getPushInfo(ns.extType);
				pushMoveOption = {
					param : {
						noticeIdx: ns.url
					}
				};

				if (pageInfo.get().SCREEN_ID.indexOf('login') != -1) {
					pushMoveOption.param.isButtonHide = true;
				}

			break;
			}

			if ( pushPageInfo || isRichPush ) {
				popupManager.alert(message, {
					title : notification.title(),
					buttons : [ "닫기", "보기" ]
				},function(buttonIndex) {
					PushManager.defaultManager.readNotificationByMessageUID(messageUID);
					if (buttonIndex == 1) {
						if ( pushPageInfo ) {
							screenManager.moveToPage(pushPageInfo.pageName, pushMoveOption);
						} else if ( isRichPush ) {
							M.apps.browser(ns.url);
						}
					}
				});
			} else {
				popupManager.alert(message, {
					title:notification.title(),
					buttons:["확인"]
				});
			}

		}
		catch(e) {
			alert("Push Logic has error.\n" + e.message);
		}
	};

	window.callbackPushService = function(serviceCode, msg) {
		if (serviceCode == 0){
			popupManager.instance('푸시 알림이 설정되었습니다.');
		} else {
			popupManager.instance('푸시 알림이 설정에 오류가 발생하였습니다.');
		}
	};
})(window, document, M, $);