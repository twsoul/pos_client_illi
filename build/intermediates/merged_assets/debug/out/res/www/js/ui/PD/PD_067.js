/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var TM_NO_LIST = [];
    var C1_LIST = [];
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
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

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
            sel_Ban_Set();
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 반 변경 시 스캔 포커스
        $("#selBAN").on("change", function() {
            sel_Line_Set();
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

    // 플랜트 콤보박스 정보 조회
    var PlantReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PlantCodeList.do',
            data: {
                'LANG': getLNG,
                'WERKS': getCORP_CD
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selPLANT").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
                    $("#selPLANT").append(tag);
                }else{
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq();
                    sel_Ban_Set();
                }
            }
        });
    };

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["90"]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    $("#selLOCTP").html("");
        	    tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
        	    if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
        	}
        });
        $("#inputScan").focus();
    }

    // 반 콤보박스 정보 조회
        var sel_Ban_Set = function(){
            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/AreaCodeList.do',
                data: {
                    'PLANT_CD': $("#selPLANT").val(),
                    'LANG':getLNG,
                    'event':'반 정보 조회'
                },
                success: function(receivedData, setting) {
                    $("#selBAN").html("");
                    var tag = "";
                    tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                    if(receivedData.ListCount = 0){
                        $("#selBAN").append(tag);
                    }else{
                        $.each(receivedData.ListData, function(index,rowData){
                            tag += "<option value='" + rowData.AREA_CD + "'>" + rowData.AREA_NM + "</option>";
                        });
                        $("#selBAN").append(tag);
                        sel_Line_Set();
                    }
                }
            });
        }

        // 라인 콤보 박스 정보 조회
        var sel_Line_Set = function(obj){
            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/LineCodeList.do',
                data: {
                    'PLANT_CD': $("#selPLANT").val(),
                    'AREA_CD': $("#selBAN").val(),
                    'LINE_TYPE': '20',
                    'LANG':getLNG,
                    'event':'라인 정보 조회'
                },
                success: function(receivedData, setting) {
                    $("#selLINE").html("");
                    var tag = "";
                    tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                    if(receivedData.ListCount == 0){
                        $("#selLINE").append(tag);
                    }else{
                        $.each(receivedData.ListData, function(index,rowData){
                            tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                        });
                        $("#selLINE").append(tag);
                    }
                    $("#inputScan").focus();
                }
            });
        }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if(inputScan.length > 0) {
            if(inputScan.length < 12){
                popupManager.instance($("[data-lng='MSG.0000000226']").text(), {showtime:"LONG"}); // 올바르지 않은 바코드 구성입니다
                $("#inputScan").focus();
                return;
            }
            TMScan(inputScan);
        }
    }

    // 품번 조회 함수
    var TMScan = function(TMBarCode){
        var TM_NO = TMBarCode.substr(0,12);
        var PART_CD = TMBarCode.substr(12,TMBarCode.length);
        var bar_exists = false;
        var box_no_exists = false;
        var part_cd_exists = false;
        // TM_NO 중복 스캔 체크
        TM_NO_LIST.forEach(function(arr){
            if(TM_NO == arr){
                bar_exists = true;
            }
        });
        if(!bar_exists){
            TM_NO_LIST.push(TM_NO);
        } else {
            popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
            $("#inputScan").focus();
            return;
        }

        $("#txtTMTAG").text(parseInt($("#txtTMTAG").text())+1);
        var tag = "";
        var template = $("#ListTemplate").html();

        $("#list_pd_067_head").removeClass("blind");

        tag += template.replace(/\{\{TM_NO\}\}/gi, TM_NO)
                       .replace(/\{\{PART_CD\}\}/gi, PART_CD);
        $("#list_pd_067").prepend(tag);

        C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":"", "LOC_TP":"", "LINE_CD":"", "TM_NO":TM_NO, "PART_CD":PART_CD, "USER_ID":getUSER_ID, "RTN_MSG":""});

        $("#inputScan").focus();

    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        var userBanCheck = $("#selBAN").val();
        var userLineCheck = $("#selLINE").val();

        if(userPlantCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(userLocTpCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }
        if(userBanCheck == ""||userLineCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000280']").text(), {showtime:"LONG"}); // 반정보, 라인정보를 입력해야 저장이 가능합니다
            $("#inputScan").focus();
            return;
        }

        if($("#txtTMTAG").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        $.each(C1_LIST,function(key){
            C1_LIST[key]['PLANT_CD'] = userPlantCheck;
            C1_LIST[key]['LOC_TP'] = userLocTpCheck;
            C1_LIST[key]['LINE_CD'] = userLineCheck;
        });

        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    // PR_PDA_PD_073_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_067_C1.do',
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

        $("#list_pd_067").html("");
        $("#list_pd_067_head").addClass("blind");

        TM_NO_LIST.length = 0;
        C1_LIST.length = 0;

        $("#txtTMTAG").text("0");
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