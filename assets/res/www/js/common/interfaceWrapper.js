/**
 * Created by KangHyungWon on 2015. 12. 22..
 */

'use strict';

/**
 * InterfaceWrapper Class
 *
 * 기존에 사용하던 M Interface 중 공통처리가 빈번하게 일어나는 메서드들를 한번 Wrapping 한 클래스이다.
 *
 * 각 wrapping 메서드별로 필요한 공통처리를 추가적으로 작성하면 됨.
 *
 * @function {{dataManager, networkManager, screenManager, popupManager}}
 */
var interfaceWrapper = (function(window, document, M, undefined) {

	/**
	 * Data Management Class
	 * @returns {{getGlobalData: getGlobalData, setGlobalData: setGlobalData, getStorageData: getStorageData, setStorageData: setStorageData}}
	 */
	var dataManager = (function() {

		function global(key, value) {
			// TODO:: 공통처리

			if ( !value && !key ) {
				return M.data.global();
			}

			if ( !value ) {
				return M.sec.decrypt(M.data.global(key)).result;
			}

			return M.data.global(key, M.sec.encrypt(value.toString()).result);
		}

		function storage(key, value) {
			// TODO:: 공통처리

			if ( !value && !key ) {
				return M.data.storage();
			}

			if ( !value ) {
				return M.sec.decrypt(M.data.storage(key)).result;
			}

			return M.data.storage(key, M.sec.encrypt(value.toString()).result);
		}

		function removeGlobal(key) {
			// TODO:: 공통처리

			M.data.removeGlobal(key);
		}

		function removeStorage(key) {
			// TODO:: 공통처리

			M.data.removeStorage(key);
		}

		function param(key, value) {
			// TODO:: 공통처리

			if ( !value && !key ) {
				return M.data.param();
			}else if ( !value ) {
				return M.sec.decrypt(M.data.param(key)).result;
			}

			return M.data.param(key, M.sec.encrypt(value.toString()).result);
		}

		function removeParam(key) {
			// TODO:: 공통처리

			if ( !key ) {
				M.data.removeParam();
			} else {
				M.data.removeParam(key);
			}
		}

		return {
			global: global,
			storage: storage,
			removeStorage: removeStorage,
			removeGlobal: removeGlobal,
			param: param,
			removeParam: removeParam
		};
    })();

	/**
	 * Network Manager Class
	 * @returns {{httpSend: httpSend}}
	 */
	var networkManager = (function () {

		/**
		 * 일반적인 http 요청을 발송한다.
		 * callback 방식을 이용함
		 * @param {Object} settings - 전문 전송 시 settings
		 *
		 * @param {String} [settings.server] - 서버이름
		 * @param {String} settings.path - 서비스 경로
		 * @param {String} [settings.method] - GET, POST
		 * @param {*} settings.data - 전송할 데이터
		 * @param {Function} settings.success - 성공 시 callback
		 * @param {Function} settings.error - 에러 발생 시 callback
		 * @param {Object} [settings.indicator] - 인디게이터 옵션
		 *
		 */
		function httpSend(settings) {
		    //CONSTANT.NETWORK.SERVER.DEV -- 개발(로컬)
		    //CONSTANT.NETWORK.SERVER.DEV_SERVER -- 개발서버(madpdev)
		    //settings.server -- 운영
			var
			    server = settings.server,
			    //server = CONSTANT.NETWORK.SERVER.DEV_SERVER,
			    //server = CONSTANT.NETWORK.SERVER.DEV,
				path = settings.path,
				method = settings.method,
				data = settings.data,
				success = settings.success,
				error = settings.error,
				indicator = settings.indicator;

			// 기본값은 CONSTANT에서 사용한다.
			if (!server) {
			    //서버 미지정시 사용할 기본서버
				//server = CONSTANT.NETWORK.SERVER.KJ;
				popupManager.alert('네트워크 오류가 발생하였습니다\r\n담당자에게 문의하십시오', {
                	title: '알림'
                }, function() {
                	screenManager.moveToPage('../common/login.html', {
                		action: 'CLEAR_TOP'
                	});
                });
			}

			// 기본값은 CONSTANT에서 사용한다.
			if (!method) {
				method = CONSTANT.NETWORK.METHOD;
			}

			// 기본값은 CONSTANT에서 사용한다.
			if (!indicator) {
				indicator = CONSTANT.NETWORK.INDICATOR;
			}

			M.net.http.send({
				server: server,
				path: path,
				method: method,
				data: data,
				success: function(receivedData, settings) {
					// TODO:: 네트워크 공통 처리

					success(receivedData, settings);
				},
				error: function(errorCode, errorMessage, settings) {
					console.error(errorCode);
					console.error(errorMessage);

					// TODO:: 공통처리

					switch(errorCode) {
						case CONSTANT.NETWORK.ERROR_CODE.SESSION_TIMEOUT:
						popupManager.alert(errorMessage, {
							title: '알림'
						}, function() {
							screenManager.moveToPage('../common/login.html', {
								action: 'CLEAR_TOP'
							});
						});

						return;

						break;
					}

					if ( !error ) {
						popupManager.alert(errorMessage, {
							title: '알림'
						});

						return;
					}

					error(errorCode, errorMessage, settings);

				},
				indicator: indicator
			});
		}

		return {
			httpSend: httpSend
		};
	})();

	/**
	 * Screen Manager Class
	 * @returns {{moveToPage: moveToPage}}
	 */
	var screenManager = (function() {
		/**
		 * 화면을 이동한다
		 * @param pageName: 이동할 화면 파일명
		 * @param options: 옵션(자세한 옵션은 모피어스 위키 참조)
		 */
		function moveToPage(pageName, options) {
			// TODO:: 공통처리
			M.page.html(pageName, options);
			// TODO:: DEBUG용 URL 처리
			//M.page.html("http://10.135.190.36:9090" + pageName, options);
		}
		
		function replaceToPage(pageName, options) {
			if (wnIf.device == DT_ANDROID) {
				M.page.replace(pageName);
			} else {
				M.page.replace("/res" + pageName);
			}
			//M.page.replace("http://10.135.190.36:9090" + pageName);
		}

		function moveToBack(options) {
			M.page.back(options)
		}
		
		function reload(){
			var thisPage = M.page.info("path");
			M.page.replace(thisPage);
		}

		return {
			moveToPage: moveToPage,
			moveToBack: moveToBack,
			replaceToPage: replaceToPage,
			reload: reload
		};
	})();

	/**
	 * Popup Manager Class
	 * @returns {{alert: alert, date: date, instance: instance, list: list}}
	 */
	var popupManager = (function() {

		
		function alert(message, options, callback) {
			// TODO:: 공통처리

			if ( !options.buttons ) {
				options.buttons = CONSTANT.DEFAULT_BUTTON;
			}

			M.pop.alert(message, options, callback);
		}

		function date(options, callback) {
			// TODO:: 공통처리

			M.pop.date({
				type: options.type || 'YMD',
				initDate: options.initDate || moment().format('YYYYMMDD'),
				startDate: options.startDate || '',
				endDate: options.endDate || '',
				interval: options.interval || ''
			}, callback);
		}

		function instance(message, settings) {
			// TODO:: 공통처리

			M.pop.instance(message, settings);
		}

		function list(settings, callback) {
			// TODO:: 공통처리

			M.pop.list(settings, callback);
		}

		return {
			alert: alert,
			date: date,
			instance: instance,
			list: list
		};
	})();

	return {
		dataManager: dataManager,
		networkManager: networkManager,
		screenManager: screenManager,
		popupManager: popupManager
	};

})(window, document, M);


(function() {
	window.dataManager = interfaceWrapper.dataManager;
	window.networkManager = interfaceWrapper.networkManager;
	window.screenManager = interfaceWrapper.screenManager;
	window.popupManager = interfaceWrapper.popupManager;
})();