/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var SCAN_FLAG = "N";
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
        $("#inputScan").focus();
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

        // 플랜트 변경 시 현창, 반, 공정 콤보박스 신규 호출
        $("#selPLANT").on("change", function() {
            StorageLocationReq();
            StorageLocationReq2();
        });

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 스캔유무 선택 시
        $("input[name=\"radioSEL\"]").on("change", function() {
            if($(this).val() == "SCAN"){
                $("#txtPART_CD").val("");
                $("#txtPART_CD").attr("readonly",true);
                SCAN_FLAG = "Y";
            }
            if($(this).val() == "MANUAL"){
                $("#txtPART_CD").val("");
                $("#txtPART_CD").attr("readonly",false);
                $("#txtPART_CD").focus();
                SCAN_FLAG = "N";
            }
        });

        $(window).on('keydown', function (e) {
            console.log("e.keyCode : "+e.keyCode);
            if (e.key === 'Tab' || e.keyCode === 9) {
                e.preventDefault();
                var id = $(':focus').attr('id');
                console.log("id : "+id);

                $("#"+id).blur();
            }
        });

        $("#txtPART_CD").on('keypress', function (e) {
            console.log("e.keyCode : "+e.keyCode);
            if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 9 || e.key === 'Tab') {
                var part_cd = $(this).val();
                PartCdScan(part_cd);
            }
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on("click", function() {
            setSaveClickEvent();
        });

        // 초기화 버튼 클릭 시
        $("#btnInit").on("click", function() {
            clear();
        });
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
    		        popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
    		    }else{
    		        var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                    	tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.LINE_CD_FLAG +"'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq();
                    StorageLocationReq2();
    		    }
    		}
    	});
    };

    // 원창, 현창 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["10"]
            },
        	success: function(receivedData, setting) {
                var tag = "";
                $("#selFRLOCTP").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selFRLOCTP").append(tag);
                if($("#selPLANT").val() == getWERKS) {
                    $("#selFRLOCTP").val(getLGORT).prop("selected", true);
                }
        	}
        });
        $("#inputScan").focus();
    }

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq2 = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["20","30"]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    $("#selTOLOCTP").html("");
        	    if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selTOLOCTP").append(tag);

        	}
        });
        $("#inputScan").focus();
    }

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        if($("#txtRACK").text() == ""){
            RackOrder(inputScan);
            return;
        }
        if($("input[name=\"radioSEL\"]:checked").val() == "MANUAL"){
            popupManager.instance($("[data-lng='MSG.0000000348']").text(), {showtime:"LONG"}); // 매뉴얼 선택 시 스캔 할 수 없습니다
            return;
        }
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }

        if(inputScan.length > 0) {
            if(head_tail_chk(inputScan)){
                PartCdScan(partCdProcessing(inputScan));
            } else {
                PartCdScan(inputScan);
            }
        }
    }

    // RACK 조회 함수
    var RackOrder = function(rack_Bar) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectRackCode.do',
            data: {
                'RACK_BAR':rack_Bar,
                'event':'RACK 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000305']").text(), {showtime:"LONG"}); // RACK 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selTOLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
                    $("#inputScan").focus();
                    return;
                }

                $("#txtRACK").text(rowData.RACK_BAR);
                $("#inputScan").focus();
            }
        });
    }

    var head_tail_chk = function(deli_bar_no){
        var head,tail;
            console.log(deli_bar_no);
            head = deli_bar_no.substr(0,4);
            console.log(head);
            tail = deli_bar_no.substr(deli_bar_no.length-4,4);
            console.log(tail);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    // 바코드 PART_CD 추출 함수
    var partCdProcessing = function(barcode){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:P[0-9,A-Z](?!G,?!A).{1,}:/g.exec(barcode);
        console.log("myResult : "+myResult);
        if (myResult!=null) {
            var part_no = myResult[0].substr(2,myResult[0].length-3);
            console.log("part_no : "+part_no);
            if (part_no.indexOf(":")<0) {
                console.log(part_no);
                return part_no;
            }else{
                var strPart= part_no.substr(0,part_no.indexOf(":"));
                //strPart = strPart.replace(/-+/,"");
                console.log(strPart);
                return strPart;
            }
        }else{
            return "";
        }
    }

    // 부품식별표 조회 함수
    var PartCdScan = function(part_cd) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_140_S1.do',
            data: {
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'PART_CD': part_cd,
                'LANG':getLNG,
                'event':'품번 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000494']").text(), {showtime:"LONG"}); // 현재 플랜트에 존재하는 품번이 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(part_cd)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }

                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#txtPART_CD").val(part_cd);

                var tag = "";
                var template = $("#ListTemplate").html();
                $("#list_ot_140_head").removeClass("blind");
                tag += template.replace(/\{\{PART_CD\}\}/, part_cd)
                               .replace(/\{\{BAR_QTY\}\}/, rowData.BOX_QTY)
                               .replace(/\{\{BOX_QTY\}\}/, 1);
                $("#list_ot_140").prepend(tag);

                SCAN_FLAG = "Y";
                $("#inputScan").focus();
            }
        });
    };

    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#list_ot_140 .tableCont").length == 0){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        if($("input[name=\"radioSEL\"]:checked").val() == "MANUAL"){
            if(SCAN_FLAG == "Y"){
                save();
            }
        }else{
            save();
        }
    }

    var save = function() {
        saveflag = true;
        var C1_LIST = [];
        var C2_LIST = [];

        C1_LIST.push({"PLANT_CD":$("#selPLANT").val(), "RTN_MSG":""});
        $("#list_ot_140 .tableCont").each(function() {
            C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "FR_LOC_TP":$("#selFRLOCTP").val(), "TO_LOC_TP":$("#selTOLOCTP").val(), "PART_CD":$(this).find(".PART_CD").text(), "ORD_QTY":$(this).find(".BOX_QTY").val(), "FEEDING_LOC":$("#txtRACK").text(), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
        });

        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_140_C1.do',
            data: {
                'param1': C1_LIST,
                'param2': C2_LIST,
                'event':'긴급불출오더'
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    saveflag = false;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                saveflag = false;
            }
        });
    }


    var clear = function(){
        $("#selPLANT").attr("disabled",false);
        $("#list_ot_140_head").addClass("blind");
        $("#list_ot_140").html("");
        $("#txtPART_CD").val("");
        $("#txtRACK").text("");
        SCAN_FLAG = "N";

        if($("input[name=\"radioSEL\"]:checked").val() == "MANUAL"){
            $("#txtPART_CD").attr("readonly",false);
            $("#txtPART_CD").focus();
        }else{
            $("#inputScan").focus();
        }
        saveflag = false;
    }

    var inputEvent = function(obj) {
        $(obj).val()

        if($(obj).val() == "" || $(obj).val() <= 0){
            $(obj).val(1);
            $(obj).click();
        }
    };

    var manualEvent = function(part_cd){
        if($("input[name=\"radioSEL\"]:checked").val() == "MANUAL"){
            if(part_cd != ""){
                console.log("스캔됨");
                PartCdScan(part_cd);
            }else{
                $("#txtPART_CD").click();
            }
        }
    }

    // Part_cd가 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(part_cd){
        var rtn = false;

        $("#list_ot_140 .tableCont").each(function() {
            if($(this).find(".PART_CD").text() == part_cd){
                rtn = true;
                return false; // each문의 break;
            }
        });

        return rtn;
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