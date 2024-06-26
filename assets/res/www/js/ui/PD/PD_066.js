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
    var saveflag = false;

    var SERIAL_LIST = [];
    var C1_LIST = [];

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

        // 플랜트 변경 시 반납창고 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
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
                $("#selPLANT").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").prepend(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                }
            }
        });
    };

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        var box_no = boxBarProcessing(inputScan);;
        var part_cd = PartCdProcessing(inputScan);;

        if(inputScan.length > 0) {
            if($("#txtBOX_NO").text()== ""){
                if(box_no == "" || part_cd == ""){
                    popupManager.instance($("[data-lng='MSG.0000000479']").text(), {showtime:"LONG"}); // 잘못된 바코드 형식입니다
                    $("#inputScan").focus();
                    return;
                }
                BoxNoScan(box_no,part_cd);
            } else {
                if($("#txtFR_BOX_NO").text()== ""){
                    if(box_no == "" || part_cd == ""){
                        popupManager.instance($("[data-lng='MSG.0000000479']").text(), {showtime:"LONG"}); // 잘못된 바코드 형식입니다
                        $("#inputScan").focus();
                        return;
                    }
                    if(box_no == $("#txtBOX_NO").text()){
                        popupManager.instance($("[data-lng='MSG.0000000300']").text(), {showtime:"LONG"}); // 병합하고자 하는 부품식별표입니다
                        $("#inputScan").focus();
                        return;
                    }
                    $("#txtFR_BOX_NO").text(box_no);
                    $("#inputScan").focus();
                    return;
                }
                SerialScan(serialNoProcessing(inputScan));
            }
        }
    }

    var BoxNoScan = function(box_no,part_cd){
        console.log("box_no : "+box_no);
        console.log("part_cd : "+part_cd);
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_066_S1.do',
            data: {
                'BOX_NO':box_no,
                'PART_CD':part_cd,
                'event':'PD_066_S1 부품식별표 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    $("#selPLANT").attr("disabled",true);
                    $("#txtBOX_NO").text(box_no);
                    $("#txtPART_CD").text(part_cd);
                    $("#txtQTY").text(0);
                    $("#txtEXPQTY").text(0);
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.MAP_BAR_NO != undefined){
                    popupManager.instance($("[data-lng='MSG.0000000555']").text(), {showtime:"LONG"}); // 이미 맵핑된 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#selPLANT").attr("disabled",true);
                $("#txtBOX_NO").text(rowData.BOX_NO);
                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtQTY").text(rowData.CNT);
                $("#txtEXPQTY").text(rowData.CNT);
                $("#inputScan").focus();
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

    // 바코드 Box_No 추출 함수
    var boxBarProcessing = function(box_bar_no){ // 바코드 예시 - [)>06VPF30P88332MU321ASET211201MC3510051@48EAMC
        var myResult = /T.{2,}/g.exec(box_bar_no);
        console.log(box_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(2,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf("@")));
            return box_no.substr(0,box_no.indexOf("@"));
        }else{
            return "";
        }
    }

    // 바코드 Part_CD 추출 함수
    var PartCdProcessing = function(box_bar_no){ // 바코드 예시 - [)>06VPF30P88332MU321ASET211201MC3510051@48EAMC
        var myResult = /P.{2,}/g.exec(box_bar_no);
        console.log(box_bar_no);
        if (myResult!=null){
            var part_cd = myResult[0].substr(2,myResult[0].length-1);
            console.log(part_cd.substr(0,part_cd.indexOf("")));
            return part_cd.substr(0,part_cd.indexOf(""));
        }else{
            return "";
        }
    }

    // 시리얼 조회 함수
    var SerialScan = function(serial){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_066_S2.do',
            data: {
                'PLANT_CD':$("#selPLANT option:selected").val(),
                'BOX_NO':$("#txtFR_BOX_NO").text(),
                'SERIAL_NO':serial,
                'event':'PD_066_S2 Serial 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;
                var box_no_exists = false;
                var part_cd_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000556']").text(), {showtime:"LONG"}); // SERIAL 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PART_CD != $("#txtPART_CD").text()){
                    popupManager.instance($("[data-lng='MSG.0000000557']").text(), {showtime:"LONG"}); // 부품식별표와 일치하지 않는 품번입니다
                    $("#inputScan").focus();
                    return;
                }

                // TM_NO 중복 스캔 체크
                SERIAL_LIST.forEach(function(arr){
                    if(arr == rowData.SERIAL_NO){
                        bar_exists = true;
                    }
                });
                if(!bar_exists){
                    SERIAL_LIST.push(rowData.SERIAL_NO);
                } else {
                    console.log("스캔 중복");
                    popupManager.instance($("[data-lng='MSG.0000000558']").text(), {showtime:"LONG"}); // 이미 스캔한 SERIAL입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#txtSERIAL").text(parseInt($("#txtSERIAL").text())+1);
                $("#txtEXPQTY").text(parseInt($("#txtEXPQTY").text())+1);
                var tag = "";
                var template = $("#ListTemplate").html();
                $("#list_pd_066_head").removeClass("blind");

                tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                               .replace(/\{\{BOX_NO\}\}/, rowData.BOX_NO)
                               .replace(/\{\{SERIAL\}\}/gi, rowData.SERIAL_NO)
                               .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                               .replace(/\{\{POP_CD\}\}/, rowData.POP_CD)
                               .replace(/\{\{LINE_CD\}\}/, rowData.LINE_CD);
                $("#list_pd_066").prepend(tag);

                $("#inputScan").focus();
            }
        });
    }

    // 바코드 serial 추출 함수
    var serialNoProcessing = function(serial_no){ // 바코드 예시 - SL21K0102824/1.2
        var myResult = serial_no + "/";
        console.log(serial_no);
        if (myResult!=null){
            var box_no = myResult.substr(0,myResult.length);
            console.log(box_no.substr(0,box_no.indexOf("/")));
            return box_no.substr(0,box_no.indexOf("/"));
        }else{
            return "";
        }
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtSERIAL").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        $("#list_pd_066 .tableCont").each(function() {
            C1_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT option:selected").val(), "BOX_NO":$("#txtFR_BOX_NO").text(), "SERIAL_NO":$(this).find(".SERIAL").text(), "TO_BOX_NO":$("#txtBOX_NO").text(), "POP_CD":$(this).data("popcd"), "LINE_CD":$(this).data("linecd"), "PART_CD":$(this).data("partcd"), "USER_ID":getUSER_ID, "RTN_MSG":""});
        });

        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    // PR_PDA_PD_066_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_066_C1.do',
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

        $("#list_pd_066").html("");

        $("#list_pd_066_head").addClass("blind");
        $("#selPLANT").attr("disabled",false);
        SERIAL_LIST.length = 0;
        C1_LIST.length = 0;
        $("#txtBOX_NO").text("");
        $("#txtFR_BOX_NO").text("");
        $("#txtPART_CD").text("");
        $("#txtQTY").text("");
        $("#txtEXPQTY").text("");

        $("#txtSERIAL").text("0");
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