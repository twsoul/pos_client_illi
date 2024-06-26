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

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 섹터 변경 시 스캔 포커스
        $("#selSECTOR").on('change', function() {
            $("#inputScan").focus();
        })

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
                SectorReq();
                OtLocTpReq();
        	},
        	error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

    //  저장위치 조회
    var OtLocTpReq = function() {
        console.log("OtLocTpReq");
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/PD_072_S2.do',
        	data: {
        	    'LANG': getLNG,
        	    'COPORATE_CD': getCORP_CD,
            	'VENDOR_CD': getVEND_CD
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
                $("#selLOCTP").html("");
        	    if(receivedData.ListCount != 0){
        	        $.each(receivedData.ListData, function(index,rowData){
                       tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                }
                $("#selLOCTP").append(tag);
        	},
        	error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

    //  섹터 조회
    var SectorReq = function() {
        console.log("SectorReq");
        console.log("getVEND_CD : "+getVEND_CD);
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/PD_072_S3.do',
        	data: {
        	    'LANG': getLNG,
        	    'COPORATE_CD': getCORP_CD,
            	'VENDOR_CD': getVEND_CD

            },
        	success: function(receivedData, setting) {
        	    var tag = "";
                $("#selSECTOR").html("");
        	    if(receivedData.ListCount != 0){
        	        $.each(receivedData.ListData, function(index,rowData){
                       tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                }
                $("#selSECTOR").append(tag);
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
                BarCodeLength(inputScan);
            }
        }
    }

    var TagInfoScan = function(tag_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_072_S5.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'VENDOR_CD':getVEND_CD,
                'TAG_NO':tag_no,
                'event':'Tag 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000511']").text(), {showtime:"LONG"}); // TAG 정보가 없습니다
                    $("#inputScan").focus();
                    return;
                }

                if(rowData.PACK_QTY <= rowData.PACK_CNT){
                    popupManager.instance($("[data-lng='MSG.0000000512']").text(), {showtime:"LONG"}); // 이미 보관처리된 TAG입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#txtTAG").text(rowData.TAG_NO);
                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtPART_NM").text(rowData.PART_NM);
                $("#txtPACK_QTY").text(rowData.PACK_QTY);
                $("#txtTM").text(rowData.PACK_CNT);
                $("#inputScan").focus();
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

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
                var TM_NO = inputScan.substr(parseInt(rowData.COM_CD_REF1),16);
                TMScan(TM_NO);
            }
        });
    }

    var TMScan = function(inputScan){
        var TM_NO = inputScan;

        if(parseInt($("#txtPACK_QTY").text()) <= parseInt($("#txtTM").text())){
            popupManager.instance($("[data-lng='MSG.0000000515']").text(), {showtime:"LONG"}); // TM수량이 적입수량을 초과할 수 없습니다
            $("#inputScan").focus();
            return;
        }
        console.log("TM_NO : "+TM_NO);
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectOtTmNo.do',
            data: {
                'VENDOR_CD':getVEND_CD,
                'TM_NO':TM_NO,
                'event':'TM NO 입고 여부 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    if(TM_NO.length == 16){
                        SetTm16(TM_NO);
                    }
                    if(TM_NO.length == 12){
                        SetTm12(TM_NO);
                    }
                    return;
                }
                if(rowData.BAR_NO != undefined){
                    popupManager.instance($("[data-lng='MSG.0000000491']").text(), {showtime:"LONG"}); // 이미 보관된 TM 입니다
                    $("#inputScan").focus();
                    return;
                }
                console.log("inputScan : "+inputScan);
                if(TM_NO.length == 16){
                    SetTm16(TM_NO);
                }
                if(TM_NO.length == 12){
                    SetTm12(TM_NO);
                }

            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

    // 품번 조회 함수
    var SetTm12 = function(TMBarCode){
        var TM_NO = TMBarCode;
        var PART_CD = "";
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_072_S4.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'TM_NO':TM_NO,
                'event':'TM NO 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;
                var box_no_exists = false;
                var part_cd_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000513']").text(), {showtime:"LONG"}); // 품번 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PART_CD != $("#txtPART_CD").text()){
                    popupManager.instance($("[data-lng='MSG.0000000514']").text(), {showtime:"LONG"}); // TAG와 일치하지 않는 품번입니다
                    $("#inputScan").focus();
                    return;
                }
                PART_CD = rowData.PART_CD;

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
                    popupManager.instance($("[data-lng='MSG.0000000450']").text(), {showtime:"LONG"}); // 이미 스캔한 TM입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#txtTM").text(parseInt($("#txtTM").text())+1);
                if($("#txtTM").text() == $("#txtPACK_QTY").text()){
                    $("#txtTM").removeAttr('class').addClass("nBluebox1");
                }
                if($("#txtTM").text() > $("#txtPACK_QTY").text()){
                    $("#txtTM").removeAttr('class').addClass("nRedbox1");
                }
                $("#selLOCTP").attr("disabled",true);
                $("#selSECTOR").attr("disabled",true);
                var tag = "";
                var template = $("#ListTemplate").html();
                $("#list_pd_072_head").removeClass("blind");

                tag += template.replace(/\{\{TM_NO\}\}/gi, TM_NO)
                               .replace(/\{\{PART_CD\}\}/gi, PART_CD);
                $("#list_pd_072").prepend(tag);

                $("#inputScan").focus();
            }
        });
    }

    // 품번 조회 함수
    var SetTm16 = function(TMBarCode){
        console.log("SetTm16");
        var TM_NO = TMBarCode.substr(0,12);
        var PART_CD = TMBarCode.substr(12,4);

        var bar_exists = false;
        var box_no_exists = false;
        var part_cd_exists = false;

        if(PART_CD != $("#txtPART_CD").text()){
            popupManager.instance($("[data-lng='MSG.0000000514']").text(), {showtime:"LONG"}); // TAG와 일치하지 않는 품번입니다
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
            popupManager.instance($("[data-lng='MSG.0000000450']").text(), {showtime:"LONG"}); // 이미 스캔한 TM입니다
            $("#inputScan").focus();
            return;
        }
        $("#txtTM").text(parseInt($("#txtTM").text())+1);

        if($("#txtTM").text() == $("#txtPACK_QTY").text()){
            $("#txtTM").removeAttr('class').addClass("nBluebox1");
        }
        if($("#txtTM").text() > $("#txtPACK_QTY").text()){
            $("#txtTM").removeAttr('class').addClass("nRedbox1");
        }

        $("#selLOCTP").attr("disabled",true);
        $("#selSECTOR").attr("disabled",true);
        var tag = "";
        var template = $("#ListTemplate").html();
        $("#list_pd_072_head").removeClass("blind");

        tag += template.replace(/\{\{TM_NO\}\}/gi, TM_NO)
                       .replace(/\{\{PART_CD\}\}/gi, PART_CD);
        $("#list_pd_072").prepend(tag);

        $("#inputScan").focus();
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtTM").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if($("#selSECTOR").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000487']").text(), {showtime:"LONG"}); // 섹터를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if($("#selLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        $("#list_pd_072 .tableCont").each(function() {
            C1_LIST.push({"VENDOR_CD":getVEND_CD, "TM_NO":$(this).find(".TM_NO").text(), "PART_CD":$(this).find(".PART_CD").text(), "OT_LOC_TP":$("#selLOCTP").val(), "SAVE_LOC":$("#selSECTOR").val(),"TAG":$("#txtTAG").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
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
            path: 'api/PR_PDA_PD_072_C1.do',
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
                 C1_LIST.length = 0;
                 saveflag = false;
             }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        console.log("clear");

        $("#list_pd_072").html("");

        $("#list_pd_072_head").addClass("blind");
        $("#selLOCTP").attr("disabled",false);
        $("#selSECTOR").attr("disabled",false);
        TM_NO_LIST.length = 0;
        C1_LIST.length = 0;
        $("#txtTAG").text("");
        $("#txtPART_CD").text("");
        $("#txtPART_NM").text("");
        $("#txtPACK_QTY").text("");

        $("#txtTM").text("0").removeAttr('class').addClass("nRedbox1");
        saveflag =false;
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