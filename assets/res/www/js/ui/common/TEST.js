/*******************************************************************
*	로그인 페이지 메인 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
	// 화면 초기화
	var setInitScreen = function() {
		
	};
	// 이벤트 초기화
	var setInitEvent = function() {
		$("#btnCamera").on("click", getCameraImage);
		$("#btnPicker").on("click", getPickerImage);
		$("#btnUpload").on("click", imageFileUpload);
		$("#btnShow").on("click", getServerImage);
		$("#btnNewBarcode").on("click", getBarcode);
		$("#btnNotificationTest").on("click", setNotification);
		
		$("#btnGPSOn").on("click", setGPSOn);
		$("#btnGPSOff").on("click", setGPSOff);
		
		$("#btnDOCInfo").on("click", getDOCInfo);
		$("#btnDOCUpload").on("click", getDOCUpload);
		$("#btnDOCViewer").on("click", getDOCViewer);

		$("#btnWSDL").on("click", getWSDL);
	};
	
	var getCameraImage = function() {
		M.media.camera({
			mediaType: "PHOTO",
			allowEdit: false,
			/*saveAlbum: true,*/
			callback: function(status, result, option) {
				if (status == 'SUCCESS') {
					var photo_path = result.path;
					var photo_name = result.name;
					$("#areaImage").html("<img src=\"" + photo_path + "\" id=\"img01\">");
				} else {
					popupManager.instance('사진 촬영이 취소 되었습니다.');
				}
			}
		});
	};
	
	var getPickerImage = function() {
		M.media.picker({
			mode: "SINGLE",
			media: "PHOTO",
			callback: function( status, result ) {
				//alert( status + ", " + JSON.stringify(result) );
				//alert("file://" + result.path);
				if (status == "SUCCESS"){
					$("#areaImage").html("<img src=\"" + result.path + "\" id=\"img01\">");
				} else {
					popupManager.instance('이미지 선택이 취소 되었습니다.');
				}
				
			}
		});
	};
	
	var imageFileUpload = function() {
		var imgFile = $("#img01").attr("src");
		var bodyFile = [{name:"file", content: imgFile, type: "FILE"}];
		//alert(CONSTANT.NETWORK.UPLOAD_URL);
		//alert(JSON.stringify(bodyFile));
		
		M.net.http.upload({
			url: CONSTANT.NETWORK.UPLOAD_URL,
			header: {},
			params: {},
			body: bodyFile,
			encoding : "UTF-8",
			finish : function(statusCode, header, body, status, error) {
				/*alert("status : " + status);
				alert("header : " + JSON.stringify(header));
				alert("body : " + JSON.stringify(body));
				alert("setting : " + setting);*/
				if (status == "SUCCESS"){
					popupManager.instance('이미지 파일 업로드가 완료되었습니다.');
				} else {
					popupManager.instance('이미지 파일 업로드가 실패 하였습니다. 잠시 후 다시시도 하시기 바랍니다.\r\n' + error);
				}
				imageFileDelete();
			},
			progress : function(total, current) {
				//console.log(total, current);
			}
		});
	};
	
	var imageFileDelete = function() {
		var imgFile = $("#img01").attr("src");
		var removeFiles = [];
		removeFiles.push(imgFile);
		M.media.removeLibrary({
			files: removeFiles,
			media: "PHOTO"
		}, function(status, setting) {
			alert(status);
		});
	};
	
	var getServerImage = function() {
		$("#areaImage").html("<img src=\"http://10.135.190.36/api/image/20170821_082249\" id=\"img01\">");
	};
	
	var getBarcode = function() {
        if (wnIf.device == DT_ANDROID) {
            M.page.activity("SimpleScannerActivity");
        } else {
            M.execute("wn2PluginQrScan",{
                flash : false,
                fadeToggle : false,
                orientation : 'PORT',
                callback: M.response.on( function( result ) {
                    if(result.status === "SUCCESS"){
                        alert("result : " + result.status);
                        alert("result format : " + result.format);
                        alert("result text : " + result.text);
                    }else{
                        console.log(result.status);
                    }
                                              
                }).toString()
            }
            );
        }
	};
	
	var setNotification = function() {
		networkManager.httpSend({
			path: 'api/PushSend.do',
			data: {
				'MODE': "11",
				"PACK_ORDR_NO": "D007201709080001"
			},
			success: function(receivedData, setting) {
				alert(JSON.stringify(receivedData));
			}
		});
	};
	
	var setGPSOn = function() {
		exWNStartGPSInfo("D007201709080001", "3000","GCS");
		alert("시작");
	};
	
	var setGPSOff = function() {
		exWNStopGPSInfo();
		alert("종료");
	};
	
	var getDOCInfo = function() {
		networkManager.httpSend({
			path: 'api/WSDocInfo.do',
			data: {
				'FILE_NAME': "Chrysanthemum.jpg",
				"FILE_ID":"aa5e748e4b1ea3ba-392caf5daff430ef"
			},
			success: function(receivedData, setting) {
				alert(JSON.stringify(receivedData));
				var convertResult = receivedData.RESULT.fileInfo.CONVERT_STATE;
				alert("변환코드 : " + convertResult);
				$("#logArea").text(JSON.stringify(receivedData));
			}
		});
	};
	
	var getDOCUpload = function() {
		networkManager.httpSend({
			path: 'api/WSDocUpload.do',
			data: {
				'FILE_NAME': "Chrysanthemum.jpg"
			},
			success: function(receivedData, setting) {
				alert(JSON.stringify(receivedData));
				$("#logArea").text(JSON.stringify(receivedData));
			}
		});
	};
	
	var getDOCViewer = function() {
         M.page.activity("PdfDocumentAdapter");
	};

	var getWSDL = function() {
	    networkManager.httpSend({
    		path: 'api/MeasureUnit.do',
    		data: {
                'spras': 'ko',
                'event':'단위정보'
            },
    		success: function(receivedData, setting) {
    			alert(JSON.stringify(receivedData));
    			$("#logArea").text(JSON.stringify(receivedData));
    		},
    		error: function(errorCode, errorMessage){
    		    alert(errorCode + " : " + errorMessage);
    		}
    	});
    };
	
	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack
	};
})(window, document, $, M);

/*******************************************************************
*	MCore Common Events
*******************************************************************/
M.onReady(function(e) {
	page.setInitScreen();
	page.setInitEvent();
}).onHide(function(e){
	// 화면 이동 전에 호출
}).onRestore(function(e) {
	// 해당화면으로 다시 돌아왔을때 호출
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});

function fnBarcodeCallback(data){
	$("#areaBarcode").html(decodeURIComponent(data.result));
}
