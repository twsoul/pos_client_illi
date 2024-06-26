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

    var TM_NO_LIST = [];
    var C1_LIST = [];
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();
                if(inputScan != ""){
                    BarCodeLength(inputScan);
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

    var BarCodeLength = function(inputScan){
        console.log("inputScan : "+inputScan);
        console.log("inputScan.length : "+inputScan.length);
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtTmLen.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'TM_LEN':inputScan.length,
                'event':'TM NO 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000559']").text(), {showtime:"LONG"}); // 새로운 유형의 코드입니다. 기준정보 등록 후 스캔해주십시오
                    $("#inputScan").focus();
                    return;
                }
                var TM_NO = inputScan.substr(parseInt(rowData.COM_CD_REF1),12);
                TMScan(TM_NO);
            }
        });
    }

    // 품번 조회 함수
    var TMScan = function(TMBarCode){
        var TM_NO = TMBarCode;

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtTmNo.do',
            data: {
                'VENDOR_CD':getVEND_CD,
                'TM_NO':TM_NO,
                'event':'TM NO 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;
                var box_no_exists = false;
                var part_cd_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000432']").text(), {showtime:"LONG"}); // TM_NO가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.OUT_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000488']").text(), {showtime:"LONG"}); // 이미 불출된 TM입니다
                    $("#inputScan").focus();
                    return;
                }

                // TM_NO 중복 스캔 체크
                TM_NO_LIST.forEach(function(arr){
                    if(TM_NO == arr){
                        bar_exists = true;
                    }
                });
                if(!bar_exists){
                    TM_NO_LIST.push(TM_NO);
                } else {
                    console.log("스캔 중복");
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#txtTMTAG").text(parseInt($("#txtTMTAG").text())+1);
                var tag = "";
                var template = $("#ListTemplate").html();
                var PART_CD = rowData.PART_CD;
                $("#list_pd_075_head").removeClass("blind");

                if(rowData.PART_CD == undefined || rowData.PART_CD == "undefined" || rowData.PART_CD == null){
                    PART_CD = "";
                }

                tag += template.replace(/\{\{SERIAL_NO\}\}/gi, rowData.SERIAL_NO)
                               .replace(/\{\{PART_CD\}\}/gi, PART_CD);
                $("#list_pd_075").prepend(tag);

                C1_LIST.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":getWERKS, "LOC_TP":rowData.OT_LOC_TP, "VENDOR_CD":rowData.VENDOR_CD, "SERIAL_NO":rowData.SERIAL_NO, "TM_NO":rowData.TM_NO, "SAVE_LOC":rowData.SAVE_LOC, "PART_CD":PART_CD, "MEMO":"", "USER_ID":getUSER_ID, "RTN_MSG":""});


                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtTMTAG").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        ScanPopup();
    }

    // PR_PDA_PD_071_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        console.log("save fn");
        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_075_C1.do',
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
            }
        });

    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        console.log("clear");

        $("#list_pd_075").html("");
        $("#list_pd_075_head").addClass("blind");

        TM_NO_LIST.length = 0;
        C1_LIST.length = 0;

        $("#txtTMTAG").text("0");
        saveflag =false;
        $("#inputScan").focus();
    }

    // 메모 팝업 함수
    var ScanPopup = function(){
        objScanInput = new InputMEMOPopup({ title:$("[data-lng='LB.0000000435']").text(), id: "popMemo", type: "text", label:$("[data-lng='LB.0000000436']").text(),value:"", goBottom: true, submitCallback: function(val){
            console.log("val :"+val);
            $.each(C1_LIST,function(key){
                 C1_LIST[key]['MEMO'] = val;
            });

            save();

        }});
        objScanInput.init();
        objScanInput.show();
        $("#popMemo input").focus();
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