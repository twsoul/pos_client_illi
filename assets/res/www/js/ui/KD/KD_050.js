/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');
    var Box_No_List = [];

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
                    console.log("스캔됨");
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            if($("#selPLANT").val() == "1192") {
                StorageLocationReq("50");
            } else {
                StorageLocationReq("10");
            };
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
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
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    if($("#selPLANT").val() == "1192") {
                        StorageLocationReq("50");
                    } else {
                        StorageLocationReq("10");
                    };
                }
            }
        });
    };

    // 저장위치 콤보박스 정보 조회
    var StorageLocationReq = function(type) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': [type]
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selLOCTP").html("");
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

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();

        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }

        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectKDBoxNo.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000507']").text(), {showtime:"LONG"}); // 입하상태이므로 불출할 수 없습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.BOX_OUT_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000382']").text(), {showtime:"LONG"}); // 이미 출고된 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                var cnt = 0;
                $.each(Box_No_List,function(key,value){
                    var exist = false;
                    var exist2 = false;
                    $.each(value,function(key,value){
                        if(key == "PART_CD" && value == rowData.PART_CD){
                            exist = true;
                        }
                        if(exist && key == "WH_CD" && value == rowData.WH_CD){
                            exist2 = true;
                        }
                        if(exist2 && key == "FIFO_FLAG" && parseInt(value) < rowData.FIFO_FLAG){
                            cnt ++;
                        }
                    });
                });

                // 선입선출 위배 여부 처리
                if(rowData.FIFO_CHK == "Y"){
                    if(cnt < rowData.FIFO_FLAG){
                        popupManager.alert($("[data-lng='MSG.0000000333']").text(), { // 선입선출에 위배 되었습니다 그래도 저장하시겠습니까?
                        title: $("[data-lng='MSG.0000000004']").text(), // 알림
                        buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
                        }, function(index) {
                            if (index == 1){
                                $("#inputScan").focus();
                                return;
                            } else {
                                var tag = "";
                                var template = $("#ListTemplate").html();
                                var exists = false;
                                $("#list_kd_050 .tableCont").each(function() {
                                    if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 개수 추가
                                        $(this).find(".BAR_QTY").text(parseInt($(this).find(".BAR_QTY").text()) + parseInt(rowData.BAR_QTY));
                                        $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);
                                        $(this).prependTo('div .list_kd_050:eq(1)');
                                        exists = true;
                                    }
                                });
                                if(!exists){
                                    tag += template.replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD);
                                }

                                // 스캔시 플랜트와 원창 선택 불가
                                $("#selPLANT").attr("disabled",true);
                                $("#selLOCTP").attr("disabled",true);

                                // 헤더 생성
                                $("#list_kd_050_head").removeClass("blind");

                                // 스캔마다 BOX 개수 증가
                                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                                $("#list_kd_050").prepend(tag);
                                Box_No_List.push({"FIFO":"Y", "COPORATE_CD":rowData.COPORATE_CD, "TO_PLANT_CD":$("#selPLANT").val(), "TO_LOC_TP":$("#selLOCTP").val(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "BAR_QTY":rowData.BAR_QTY,  "USER_ID":getUSER_ID, "RTN_MSG":"", "WH_CD":rowData.WH_CD, "FIFO_FLAG":rowData.FIFO_FLAG})
                                $("#inputScan").focus();
                            }
                        });
                    } else {
                        var tag = "";
                        var template = $("#ListTemplate").html();
                        var exists = false;
                        $("#list_kd_050 .tableCont").each(function() {
                            if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 개수 추가
                                $(this).find(".BAR_QTY").text(parseInt($(this).find(".BAR_QTY").text()) + parseInt(rowData.BAR_QTY));
                                $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);
                                $(this).prependTo('div .list_kd_050:eq(1)');
                                exists = true;
                            }
                        });
                        if(!exists){
                            tag += template.replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                                           .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD);
                        }
                        // 스캔시 플랜트와 원창 선택 불가
                        $("#selPLANT").attr("disabled",true);
                        $("#selLOCTP").attr("disabled",true);

                        // 헤더 생성
                        $("#list_kd_050_head").removeClass("blind");

                        // 스캔마다 BOX 개수 증가
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                        $("#list_kd_050").prepend(tag);
                        Box_No_List.push({"FIFO":"N", "COPORATE_CD":rowData.COPORATE_CD, "TO_PLANT_CD":$("#selPLANT").val(), "TO_LOC_TP":$("#selLOCTP").val(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "BAR_QTY":rowData.BAR_QTY,  "USER_ID":getUSER_ID, "RTN_MSG":"", "WH_CD":rowData.WH_CD, "FIFO_FLAG":rowData.FIFO_FLAG})
                        $("#inputScan").focus();
                    }
                } else {
                    var tag = "";
                    var template = $("#ListTemplate").html();
                    var exists = false;
                    $("#list_kd_050 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 개수 추가
                            $(this).find(".BAR_QTY").text(parseInt($(this).find(".BAR_QTY").text()) + parseInt(rowData.BAR_QTY));
                            $(this).find(".BOX_QTY").text(parseInt($(this).find(".BOX_QTY").text()) + 1);
                            $(this).prependTo('div .list_kd_050:eq(1)');
                            exists = true;
                        }
                    });
                    if(!exists){
                        tag += template.replace(/\{\{BAR_QTY\}\}/, rowData.BAR_QTY)
                                       .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD);
                    }
                    // 스캔시 플랜트와 원창 선택 불가
                    $("#selPLANT").attr("disabled",true);
                    $("#selLOCTP").attr("disabled",true);

                    // 헤더 생성
                    $("#list_kd_050_head").removeClass("blind");

                    // 스캔마다 BOX 개수 증가
                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                    $("#list_kd_050").prepend(tag);
                    Box_No_List.push({"FIFO":"N", "COPORATE_CD":rowData.COPORATE_CD, "TO_PLANT_CD":$("#selPLANT").val(), "TO_LOC_TP":$("#selLOCTP").val(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "BAR_QTY":rowData.BAR_QTY,  "USER_ID":getUSER_ID, "RTN_MSG":"", "WH_CD":rowData.WH_CD, "FIFO_FLAG":rowData.FIFO_FLAG})
                    $("#inputScan").focus();
                }
            }
        });
    };

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var save_Chk = true;
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        save();
    }

    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_050_C1.do',
            data: {
                'param1': Box_No_List
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
                console.log("Save error");
                Box_No_List.length = 0;
                saveflag = false;
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_050").html("");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#list_kd_050_head").addClass("blind");
        $("#inpBoxQty").text("0");
        Box_No_List.length = 0;
        saveflag = false;
        $("#inputScan").focus();
    }

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;
        $.each(Box_No_List,function(key,value){
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                if(key == "BOX_NO" && value == box_no){
                    rtn = true;
                    return false;
                }
            });
        });
        return rtn;
    };

    var inputEvent = function(obj) {
        $(obj).val()

        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
        }
    };

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {

	};

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		setReloadEvent: setReloadEvent,
		inputEvent: inputEvent
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
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});