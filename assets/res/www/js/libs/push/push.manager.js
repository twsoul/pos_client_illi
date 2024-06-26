
//(function( window, undefined ) {

/**
 * PushManager for MPushPlugin
 *
 * @date : 2015-07-14
 * @author : ProgDesigner (progdesigner@uracle.co.kr)
 */

var PushNotificationDidReceivedKey = "PushNotificationDidReceivedKey";
var PushNotificationReadMessagesKey = "PushNotificationReadMessagesKey";
var PushNotificationStorageKey = "PushNotificationStorageKey";
var PushNotificationEnabledKey = "PushNotificationEnabledKey";
var PushNotificationType = {
    UNKNOWN: '',
    TEXT: 'text',
    LINK: 'link',
    VIDEO: 'video',
    IMAGE: 'image',
    SECURE: 'secure'
};

// UPNS = {"HEADER":{"ACTION":"SENDMSG"},"BODY":{"MESSAGE":"dfsfdsfsdaf","EXT":"","SEQNO":"607","PSID":"3d5c7522a0a893957d230d70d196e8dcbf3785e9","APPID":"kr.co.morpheus.mobile1","CUID":"12345","MESSAGEID":"20150212143841e6fcce8440e502b45a223a54f0","PUBLIC":"N","SENDERCODE":"admin"}}
// GCM = {"aps":{"badge":"1","sound":"alert.aif","alert":"fdsafasfa"},"mps":{"appid":"com.uracle.push.test","messageuniquekey":"20141204112801b6f1fd7840868afc82e51fd6a5","seqno":"387","sender":"admin",,"ext":"http://211.241.199.139:8080/msp-admin/totalInfo\\1203143401_I.html"}}
// APNS = {"aps":{"badge":"1","sound":"alert.aif","alert":"fdsafasfa"},"mps":{"appid":"com.uracle.push.test","messageuniquekey":"20141204112801b6f1fd7840868afc82e51fd6a5","seqno":"387","sender":"admin",,"ext":"http://211.241.199.139:8080/msp-admin/totalInfo\\1203143401_I.html"}}

var PushNotificationReadMessageKeyManager = function() {

    var _keys = [], _messageKeys = {};

    return {
        _restoreKeys: function() {
            var readedMessageUniqueKeys = M.data.storage(PushNotificationReadMessagesKey);
            if ( ! readedMessageUniqueKeys || Object.prototype.toString.call( readedMessageUniqueKeys ) !== '[object Array]' ) {
                readedMessageUniqueKeys = [];
            }

            _messageKeys = {};
            _keys = [];

            for ( var i=0; i<readedMessageUniqueKeys.length; i++ ) {
                var messageUniqueKey = readedMessageUniqueKeys[i];
                _messageKeys[messageUniqueKey] = messageUniqueKey;
                _keys.push( messageUniqueKey );
            }
        },

        init: function() {
            this._restoreKeys();

            return this;
        },

        readMessage: function( key ) {
            if ( this.hasKey( key ) ) {
                return;
            }

            var messageUniqueKey = key;

            _messageKeys[key] = messageUniqueKey;
            _keys.push( key );

            this.synchronize();
        },

        reload: function() {
            this._restoreKeys();
        },

        synchronize: function() {
            M.data.storage(PushNotificationReadMessagesKey, _keys);
        },

        hasKey: function( key ) {
            return _messageKeys[key] === undefined ? false : true;
        }
    }
};

var PushNotification = function ( payload ) {

    var _payload = payload;

    return {
        messageUniqueKey: function() {
            if ( _payload.ns == 'UPNS' ) {
                if ( _payload["MESSAGEID"] != undefined ) {
                    return _payload["MESSAGEID"];
                }
            }
            else if ( _payload.ns == 'GCM' || _payload.ns == 'APNS' ) {
                if ( _payload["mps"] != undefined ) {
                    if ( _payload["mps"]["messageuniquekey"] != undefined ) {
                        return _payload["mps"]["messageuniquekey"];
                    }
                }
            }
            else if ( _payload.ns == 'LOCAL' ) {
                if ( _payload["MESSAGEUID"] != undefined ) {
                    return _payload["MESSAGEUID"];
                }
            }

            return "";
        },

        messageUID: function() {
            return this.messageUniqueKey();
        },

        pushType: function() {
            return _payload.ns;
        },

        status: function() {
            return _payload.status;
        },

        title: function() {
            var extComponents = this.ext().split("|");

            if ( extComponents.length < 2 ) {
                return "알림";
            }

            return extComponents[1] || "알림";
        },

        message: function() {
            if ( this.pushType() == 'UPNS' ) {
                if ( _payload["MESSAGE"] != undefined ) {
                    return _payload["MESSAGE"];
                }
            }
            else if ( this.pushType() == 'GCM' || this.pushType() == 'APNS' ) {
                if ( _payload["aps"] != undefined ) {
                    if ( _payload["aps"]["alert"] != undefined ) {
                        return _payload["aps"]["alert"];
                    }
                }
            }
            else if ( _payload.ns == 'LOCAL' ) {
                if ( _payload["MESSAGE"] != undefined ) {
                    return _payload["MESSAGE"];
                }
            }

            return "";
        },

        payload: function() {
            return _payload;
        },

        readed: function() {
            return readMessageKeyManager.hasKey( this.messageUniqueKey() );
        },

        read: function() {
            readMessageKeyManager.readMessage( this.messageUniqueKey() );
        },

        saveTime: function() {
            return _payload.saveTime;
        },

        dateDescription: function() {
            var saveTime = this.saveTime();

            // for Test
            //saveTime = +new Date;

            if ( saveTime == "" ) {
                return "";
            }

            var today = new Date();
            var timestamp = parseInt(saveTime);

            if ( isNaN(timestamp) ) {
                return "";
            }

            //console.log( "timestamp", timestamp );

            var date = new Date(timestamp);
            var elapsedTime = (today.getTime() - date.getTime()) * 0.001;

            if ( elapsedTime < 60 ) {
                return "방금";
            }
            else if ( elapsedTime < 60*60 ) {
                return parseInt(elapsedTime / 60) + "분 전";
            }
            else if ( elapsedTime < 60*60*2 ) {
                return "1시간 전";
            }

            if ( today.getUTCFullYear() == date.getUTCFullYear() && today.getUTCMonth() == date.getUTCMonth() && today.getUTCDate() == date.getUTCDate() ) { // isToday
                return ("0"+date.getHours()).slice(-2) + ":" + ("0"+date.getMinutes()).slice(-2) + ":" + ("0"+date.getSeconds()).slice(-2);
            }

            return ("0"+date.getMonth()).slice(-2) + "/" + ("0"+date.getDate()).slice(-2) + " " + ("0"+date.getHours()).slice(-2) + ":" + ("0"+date.getMinutes()).slice(-2) + ":" + ("0"+date.getSeconds()).slice(-2);
        },

        ext: function() {
            if ( this.pushType() == 'UPNS' ) {
                if ( _payload["EXT"] != undefined ) {
                    return _payload["EXT"];
                }
            }
            else if ( this.pushType() == 'GCM' || this.pushType() == 'APNS' ) {
                if ( _payload["mps"] != undefined ) {
                    if ( _payload["mps"]["ext"] != undefined ) {
                        return _payload["mps"]["ext"];
                    }
                }
            }

            return "";
        },

        contentURL: function() {
            var category = this.type();
            var extData = this.ext();
            var extComponents = extData.split("|");

            if ( category == PushNotificationType.LINK || category == PushNotificationType.VIDEO ) {
                if ( extComponents.length <= 3 ) {
                    return '';
                }

                var url = extComponents[3];

                if ( typeof url !== 'string' ) {
                    return '';
                }

                return url;
            }
            else if ( category == PushNotificationType.IMAGE || category == PushNotificationType.SECURE ) {
                if ( extComponents.length <= 2 ) {
                    return '';
                }

                var url = extComponents[2];

                if ( typeof url !== 'string' ) {
                    return '';
                }

                return url;
            }

            return '';
        },

        hasRichData: function() {
            return this.ext().indexOf("|") !== -1 ? true : false;
        },

        type: function() {
            if ( ! this.hasRichData() ) {
                return PushNotificationType.UNKNOWN;
            }

            var extComponents = this.ext().split("|");
            var category = extComponents[0] + '';
            var type = PushNotificationType.UNKNOWN;

            switch(category) {
                default:
                    type = PushNotificationType.UNKNOWN;
                    break;

                case "0":
                    type = PushNotificationType.TEXT;
                    break;

                case "1": // Webpage
                    type = PushNotificationType.LINK;
                    break;

                case "2": // Video or Remote URL
                    type = PushNotificationType.VIDEO;
                    break;

                case "3": // Image
                    type = PushNotificationType.IMAGE;
                    break;

                case "4": // Secure
                    type = PushNotificationType.SECURE;
                    break;
            }

            return type;
        },

        templateData: function() {

            return {
                "readState": this.readed() === true ? 'Y' : 'N',
                "type": this.type(),
                "messageUID": this.messageUniqueKey(),
                "title": this.title(),
                "time": this.dateDescription(),
                "content": this.message()
            };
        }
    };
};

var PushManager = function() {

    var _notifications = [];
    var _unreadMessageKeys = [];
    var _messageKeys = {};
    var _enabled = false;

    return {
        // Private
        _restoreNotifications: function() {
            var payloads = M.data.storage(PushNotificationStorageKey);
            if ( ! payloads || Object.prototype.toString.call( payloads ) !== '[object Array]' ) {
                payloads = [];
            }

            _messageKeys = [];
            _notifications = [];

            for ( var i=0; i<payloads.length; i++ ) {
                var payload = payloads[i];
                var notification = new PushNotification( payload );

                _messageKeys[notification.messageUniqueKey()] = notification;
                _notifications.push( notification );
            }
        },

        _restoreEnabled: function() {
            var enabled = M.data.storage(PushNotificationEnabledKey);

            if ( ! enabled || typeof enabled !== 'string' || ( typeof enabled === 'string' && ! (enabled === 'Y' || enabled === 'N') ) ) {
                enabled = 'N';
            }

            _enabled = enabled == 'Y' ? true : false;
        },

        // Life Cycle
        init: function() {
            this._restoreNotifications();
            this._restoreEnabled();

            return this;
        },

        reload: function() {
            readMessageKeyManager.reload();

            this._restoreNotifications();
            this._restoreEnabled();
        },

        // Public
        addPayload: function( payload ) {
            var notification = new PushNotification( payload );

            if ( _messageKeys[notification.messageUniqueKey()] ) {
                console.warn( "the payload is already received in push manager - ", payload);
                return;
            }

            _messageKeys[notification.messageUniqueKey()] = notification;
            _notifications.push( notification );

            this.synchronize();

            var numberOfNotifications = this.numberOfNotifications();
            var numberOfUnreadNotifications = this.numberOfUnreadNotifications();

            var userInfo = {
                notification: notification,
                numberOfNotifications: numberOfNotifications,
                numberOfUnreadNotifications: numberOfUnreadNotifications
            };

            UI.Notification.defaultCenter.postNotification( PushNotificationDidReceivedKey, userInfo );
        },

        synchronize: function() {
            M.data.storage(PushNotificationStorageKey, this.allPayloads() );
        },

        getPayloadByMessageUID: function( uid ) {
            var notification = _messageKeys[uid];
            if ( notification ) {
                return notification.payload();
            }

            return null;
        },

        getNotificationByMessageUID: function( uid ) {
            var notification = _messageKeys[uid];
            if ( notification ) {
                return notification;
            }

            return null;
        },

        readNotificationByMessageUID: function( uid ) {
            var notification = this.getNotificationByMessageUID( uid );
            if ( notification ) {
                notification.read();
            }
        },

        enabled: function( enabled ) {
            if ( arguments.length == 0 ) {
                return _enabled;
            }

            _enabled = enabled;

            if ( _enabled == true ) {
                M.plugin('push').remote.registerService({
                    onfinish: function( status, setting ) {
                        if (status == 'SUCCESS') {
                            M.plugin('push').remote.registerUser({
                                cuid: M.info.device("id"), // 비지니스 로직에 따라 변경 필수!!
                                name: M.info.device("name") || M.info.device("model"), // 비지니스 로직에 따라 변경 필수!!
                                onfinish: function( status ) {
                                    var info = M.plugin('push').info();

                                    if (status == 'SUCCESS') {
                                        M.pop.instance('[' + info.CLIENT_UID + '/' + info.CLIENT_NAME + ']의 유저 등록이 성공 하였습니다.');
                                    }
                                    else {
                                        M.pop.instance('[' + info.CLIENT_UID + '/' + info.CLIENT_NAME + ']의 유저 등록이 실패 하였습니다.');
                                    }
                                }
                            });
                        }
                        else {
                            var info = M.plugin('push').info();

                            M.pop.instance('[' + info.CLIENT_UID + '/' + info.CLIENT_NAME + ']의 서비스 등록이 실패 하였습니다.');
                        }
                    }
                });
            }
            else {
                M.plugin('push').remote.unregisterService({
                    onfinish: function( status, setting ) {
                        var info = M.plugin('push').info();

                        if (status == 'SUCCESS') {
                            M.pop.instance('[' + info.CLIENT_UID + '/' + info.CLIENT_NAME + ']의 서비스 해제가 성공 하였습니다.');
                        }
                        else {
                            M.pop.instance('[' + info.CLIENT_UID + '/' + info.CLIENT_NAME + ']의 서비스 해제가 실패 하였습니다.');
                        }
                    }
                });
            }

            M.data.storage(PushNotificationEnabledKey, _enabled == true ? 'Y' : 'N');
        },

        numberOfNotifications: function() {
            return _notifications.length;
        },

        numberOfUnreadNotifications: function() {

            var numberOfUnreadNotifications = 0;

            for ( var i=0; i<_notifications.length; i++ ) {
                var notification = _notifications[i];
                if ( ! notification.readed() ) {
                    numberOfUnreadNotifications ++;
                }
            }

            return numberOfUnreadNotifications;
        },

        notifications: function() {
            return _notifications;
        },

        templateListData: function( handler ) {
            var sortedNotifications = _notifications.sort( function( n1, n2 ) {
                return ( n1.saveTime() > n2.saveTime() ) ? -1 : 1;
            });

            var templateListData = [];

            for ( var i=0; i<sortedNotifications.length; i++ ) {
                var notification = _notifications[i];
                var templateData = notification.templateData();

                if ( handler === undefined || handler( notification ) === true ) {
                    templateListData.push( templateData )
                }
            }

            return {
                items: templateListData
            };
        },

        allPayloads: function() {
            var payloads = [];

            for ( var i=0; i<_notifications.length; i++ ) {
                var notification = _notifications[i];
                var payload = notification.payload();

                payloads.push( payload );
            }

            return payloads;
        }
    };
};

M.onReady(function(e) {
    var readMessageKeyManager = new PushNotificationReadMessageKeyManager();
    readMessageKeyManager.init();

    var pushManager = new PushManager();

    PushManager.defaultManager = pushManager.init();

    window.PushManager = PushManager;
    window.PushNotification = PushNotification;
    window.PushNotificationType = PushNotificationType;
    window.PushNotificationDidReceivedKey = PushNotificationDidReceivedKey;
});