/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var getVEND_CD = userManager.getVEND_CD();
    var saveUserCo = dataManager.storage('saveUserCo');

    var C1_LIST = [];
    var savefalg = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        VendorName();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();
                if(inputScan != ""){
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            setClearClickEvent();
        })
	};

	//  업체 이름 조회
    var VendorName = function() {
        console.log("SaveLocReq");
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/PD_072_S1.do',
        	data: {
        	    'LANG': getLNG,
            	'VENDOR_CD': getVEND_CD
            },
        	success: function(receivedData, setting) {
        	    if(receivedData.ListCount != 0){
        	        var rowData = receivedData.ListData[0];
        	        $("#txtVENDOR").text(rowData.VENDOR_NM);
                }
        	},
        	error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        console.log("inputScan : "+inputScan);
        console.log("length : " + inputScan.length);
        if(inputScan.length > 0) {
            if($("#txtTAG").text()== ""){
                if(inputScan.length != 13){
                    popupManager.instance($("[data-lng='MSG.0000000226']").text(), {showtime:"LONG"}); // 올바르지 않은 바코드 구성입니다
                    $("#inputScan").focus();
                    return;
                }
                TagInfoScan(inputScan);
            } else {
                popupManager.instance($("[data-lng='MSG.0000000510']").text(), {showtime:"LONG"}); // 이미 스캔하셨습니다
                $("#inputScan").focus();
                return;
            }
        }
    }

    var TagInfoScan = function(tag_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_076_S1.do',
            data: {
                'VENDOR_CD':getVEND_CD,
                'BAR_NO':tag_no,
                'event':'Tag 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var outFlag = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000511']").text(), {showtime:"LONG"}); // TAG 정보가 없습니다
                    $("#inputScan").focus();
                    return;
                }

                var tag = "";
                var template = $("#ListTemplate").html();

                $.each(receivedData.ListData, function(index,rowData){
                    if(rowData.OUT_FLAG == "Y") {
                        outFlag = true;
                    }
                    $("#txtTM").text(parseInt($("#txtTM").text())+1);
                    tag += template.replace(/\{\{TM_NO\}\}/gi, rowData.TM_NO)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD == undefined ? "" : rowData.PART_CD);
                });
                if(outFlag) {
                    popupManager.instance(tag_no + $("[data-lng='MSG.0000000517']").text(), {showtime:"LONG"}); // 는 이미 출고된 TM이 존재하는 TAG입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#list_pd_076_head").removeClass("blind");
                $("#txtTAG").text(tag_no);
                $("#list_pd_076").prepend(tag);

                $("#inputScan").focus();
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtTM").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        $("#list_pd_076 .tableCont").each(function() {
            C1_LIST.push({"VENDOR_CD":getVEND_CD, "TM_NO":$(this).find(".TM_NO").text(), "PART_CD":$(this).find(".PART_CD").text(), "TAG":$("#txtTAG").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
        });

        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    // PR_PDA_PD_072_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_076_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    clear();
                }
            },
             error: function(errorCode, errorMessage, settings) {
                 popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                 saveflag = false;
                 C1_LIST.length = 0;
             }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        console.log("clear");

        $("#list_pd_076").html("");

        $("#list_pd_076_head").addClass("blind");
        C1_LIST.length = 0;
        $("#txtTAG").text("");

        $("#txtTM").text("0");
        saveflag = false;
        $("#inputScan").focus();
    }

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