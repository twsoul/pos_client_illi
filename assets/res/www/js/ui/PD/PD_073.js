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
    var getTEST = optionManager.getTEST();
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
        $("#txtDate").val(window.Utils.getTodayFormat("yyyy-MM-dd"));
        $("#txtTime").val(window.Utils.getTodayFormat("HH:mm:ss"));
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

        // 플랜트 변경 시 출하구분 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            LocationMoveCodeReq();
        })

        // 출하구분 변경 시 스캔으로 포커스
        $("#selGUBUN").on('change', function() {
            $("#inputScan").focus();
        })

        $("#chk_All").on("change", function() {
            if ($("#chk_All").prop("checked")) { // 체크됨
                $("#list_pd_073 .tableCont").each(function() {
                    $(this).addClass("on");
                });
            } else { // 체크 해제됨
                $("#list_pd_073 .tableCont").each(function() {
                    $(this).removeClass("on");
                });
            }
            $("#inputScan").focus();
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 삭제 버튼 클릭 시
        $("#btnDel").on('click', function() {
            setDelClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
        })
	};

	// 플랜트 콤보박스 정보 조회
    var PlantReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectTmPlant.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'LANG': getLNG
            },
            success: function(receivedData, setting) {
                $("#selPLANT").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    LocationMoveCodeReq();
                }
            }
        });
    };

    // 출하구분 콤보박스 정보 조회
    var LocationMoveCodeReq = function() {
        var code = $("#selPLANT option:selected").val();
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocationMoveCode.do',
            data: {
                'SERVER': getTEST,
                'PLANT_CD': code.substr(0,2),
                'LINE_CD': code,
                'GROUP_ID': '100'
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selGUBUN").html("");
                $.each(receivedData.LocationMoveCodeList, function(index,rowData){
                    console.log(rowData.LocationMoveCode);
                    if(rowData.LocationMoveCode == "NG"){
                        popupManager.instance($("[data-lng='MSG.0000000011']").text(), {showtime:"LONG"}); // 시스템 설정에 필요한 정보를 ERP로 부터 받아오지 못했습니다
                        return;
                    }
                    tag += "<option value='" + rowData.LocationMoveCode + "'>" + rowData.LocationMoveCode + "</option>";
                });
                $("#selGUBUN").append(tag);
                $("#inputScan").focus();
            }
        });
    };

    var BarCodeLength = function(inputScan){
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
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000432']").text(), {showtime:"LONG"}); // TM_NO가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000454']").text(), {showtime:"LONG"}); // 보류 상태의 TM입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.OUT_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000488']").text(), {showtime:"LONG"}); // 이미 불출된 TM입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#list_pd_073 .tableCont").each(function() {
                    if($(this).find(".TM_NO").text() == rowData.TM_NO) {
                        bar_exists = true;
                    }
                });
                if(bar_exists){
                    popupManager.instance($("[data-lng='MSG.0000000450']").text(), {showtime:"LONG"}); // 이미 스캔한 TM입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#txtTMTAG").text(parseInt($("#txtTMTAG").text())+1);
                var tag = "";
                var template = $("#ListTemplate").html();
                tag += template.replace(/\{\{TM_NO\}\}/gi, rowData.TM_NO)
                               .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD);
                $("#list_pd_073").prepend(tag);
                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#selGUBUN").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000522']").text(), {showtime:"LONG"}); // 출하구분을 선택해 주십시오
            $("#inputScan").focus();
            return;
        }
        if($("#txtDate").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000580']").text(), {showtime:"LONG"}); // 출하일자를 선택해 주십시오
            $("#inputScan").focus();
            return;
        }
        if($("#txtTime").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000581']").text(), {showtime:"LONG"}); // 출하시간을 선택해 주십시오
            $("#inputScan").focus();
            return;
        }
        if($("#list_pd_073 .tableCont").length == 0) {
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        var barcode = "";
        var C1_LIST = [];
        $("#list_pd_073 .tableCont").each(function() {
            C1_LIST.push({"VENDOR_CD":getVEND_CD, "TM_NO":$(this).find(".TM_NO").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
            barcode += $(this).find(".TM_NO").text();
            barcode += $(this).find(".PART_CD").text();
            barcode += ";";
        });
        barcode = barcode.substr(0,barcode.length-1);
        popupManager.alert($("[data-lng='MSG.0000000524']").text() + $("#selGUBUN option:selected").val(), { // 출하용도코드 :
        title: $("[data-lng='MSG.0000000525']").text(), // 출하데이터확인
        buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
        }, function(index) {
            if (index == 1){
                return;
            }else{
                saveMES(barcode,C1_LIST);
            }
        })

    }

    var saveMES = function(barcode,C1_LIST) {
        var code = $("#selPLANT option:selected").val();
        var area = $("#selGUBUN option:selected").val().substr($("#selGUBUN option:selected").val().indexOf("[")+1,1);
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PDAShipIF.do',
            data: {
                'SERVER': getTEST,
                'PLANT_CD': code.substr(0,2),
                'LINE_CD': code,
                'GUBUN': '01',
                'BARCODE': barcode,
                'PROCESS_DATE': $("#txtDate").val().replace(/-/g, "")+" "+$("#txtTime").val(),
                'AREA': area,
                'UID': getUSER_ID,
                'event':'출하 데이터 수신'
            },
            success: function(receivedData, setting) {
                if(receivedData.PDAShipIFReturn=="S"){
                    if(receivedData.PDAShipIFResult == "OK") {
                        saveDB(C1_LIST);
                    } else if (receivedData.PDAShipIFResult == "NG"){
                        popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    } else {
                        var result = receivedData.PDAShipIFResult;
                        var temp = result.split(";");
                        var str = "";
                        if(temp.length >0){
                            for(var i=0;i<temp.length;i++){
                                temp[i] += "\r\n";
                                str += temp[i];
                            }
                        }
                        console.log("str : "+str);
                        popupManager.alert($("[data-lng='MSG.0000000523']").text() + "\r\n" + str, { // 보류된 TM이 포함되어 있으며, MES-출하관리 화면에서 보류해제 후 상태 변경이 가능합니다
                            title: $("[data-lng='MSG.0000000004']").text(), // 알림
                            buttons:[$("[data-lng='MSG.0000000002']").text()] // 확인
                        }, function() {
                            clear();
                            $("#inputScan").focus();
                        });
                    }
                }else if(receivedData.PDAShipIFReturn=="E"){
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    clear();
                }
            }
        });
    }

    // PR_PDA_PD_073_C1 호출 및 저장
    var saveDB = function(C1_LIST) {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_073_C1.do',
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
                console.log("error");
                clear();
            }
        });
    }

    var setDelClickEvent = function() {
        $("#list_pd_073 .tableCont").each(function() {
            if($(this).hasClass("on")) {
                $("#txtTMTAG").text(Number($("#txtTMTAG").text())-1);
                $(this).remove();
            }
        });
        $("#inputScan").focus();
    }

    var clickEvent = function(obj) {
        if($(obj).hasClass("on")) {
            $(obj).removeClass("on");
        }else{
            $(obj).addClass("on");
        };
        $("#inputScan").focus();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_pd_073").html("");
        $("#txtTMTAG").text("0");
        $("#txtDate").val(window.Utils.getTodayFormat("yyyy-MM-dd"));
        $("#txtTime").val(window.Utils.getTodayFormat("HH:mm:ss"));
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
		moveToBack: moveToBack,
		clickEvent: clickEvent
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