/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Box_No_List = [];

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        $("#date_st").val(window.Utils.getTodayFormat("yyyy.MM.dd"));
        $("#date_ed").val(window.Utils.getTodayFormat("yyyy.MM.dd"));

        PlantReq();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#date_st").on("click", function(){
            window.Utils.getCalendar("date_st", null, "date_ed");
        });
        $("#date_ed").on("click", function(){
            window.Utils.getCalendar("date_ed", "date_st", null);
        });

        // 플랜트 변경 시 반납창고 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq("10");
            SetLineDetailList();
        })

        // 반납창고 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 조회 버튼 클릭 시
        $("#btnSearch").on("click", GetSearchList);

        // 등록 버튼 클릭 시
        $("#btnRegist").on("click", goPageRegist);
	};

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {
		if ($("#txtPART_NO").val() != ""){
			GetSearchList();
		}
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
                    StorageLocationReq(10);
                    SetLineDetailList();
                }
            }
        });
    };

    // 원창 콤보박스 정보 조회
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
                if($("#selPLANT").val() == getWERKS) {
                    $("#selLOCTP").val(getLGORT).prop("selected", true);
                }
            }
        });
    }

    // 라인 콤보박스 정보 조회
    var SetLineDetailList = function() {
        console.log("SetLineDetailList");
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LineCodeList.do',
            data: {
                'LANG': getLNG,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'AREA_CD': ''
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selLINE_DT").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                     });
                }
                $("#selLINE_DT").append(tag);
            }
        });
    }

    // 부품식별표 스캔 시
    var GetSearchList = function() {
        var plant_cd = $("#selPLANT option:selected").val();
        var date_st = $("#date_st").val();
        var date_ed = $("#date_ed").val();
        var part_no = $("#txtPART_NO").val();
        var part_search_type = $("#selPART_SEARCH_TYPE option:selected").val();
        var line_cd = $("#selLOCTP option:selected").val();
        var linedt_cd = $("#selLINE_DT option:selected").val();

        console.log("plant_cd : "+plant_cd);
        console.log("date_st : "+date_st);
        console.log("date_ed : "+date_ed);
        console.log("part_no : "+part_no);
        console.log("part_search_type : "+part_search_type);
        console.log("line_cd : "+line_cd);
        console.log("linedt_cd : "+linedt_cd);

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_050_S1.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD':plant_cd,
                'FROM_DATE': window.Utils.replaceAll(date_st, ".", ""),
                'TO_DATE':window.Utils.replaceAll(date_ed, ".", ""),
                'LINE_CD':line_cd,
                'LINE_DT_CD':linedt_cd,
                'PART_SEARCH_TYPE':part_search_type,
                'PART_NO':part_no,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000538']").text(), {showtime:"LONG"}); // 조회된 데이터가 없습니다
                    $("#list_in_050").html("");
                    return;
                }

                console.log("VER_SEQ : "+rowData.VER_SEQ);
                console.log("ISSUE_DT : "+rowData.ISSUE_DT);
                console.log("ISSUE_TM : "+rowData.ISSUE_TM);
                console.log("WORK_TP : "+rowData.WORK_TP);
                console.log("PART_NO : "+rowData.PART_NO);
                console.log("PART_NM : "+rowData.PART_NM);
                console.log("LINE_DT_NM : "+rowData.LINE_DT_NM);
                console.log("PLANT_NM : "+rowData.PLANT_NM);

                var tag = "";
                var template = $("#ListTemplate").html();
                $("#list_in_050_head").removeClass("blind");
                $.each(receivedData.ListData, function(index,rowData){
                    tag += template.replace(/\{\{PLANT_NM\}\}/, rowData.PLANT_NM)
                                   .replace(/\{\{VER_SEQ\}\}/, rowData.VER_SEQ)
                                   .replace(/\{\{WORK_TP\}\}/, rowData.WORK_TP == "WK" ? "주간" : "야간")
                                   .replace(/\{\{LINE_DT_NM\}\}/, rowData.LINE_DT_NM)
                                   .replace(/\{\{PART_NO\}\}/, rowData.PART_NO)
                                   .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                                   .replace(/\{\{ISSUE_TM\}\}/, window.Utils.getStrDateComma(rowData.ISSUE_DT) + " [" + window.Utils.getStrTimeColon(rowData.ISSUE_TM) + "]")
                                   .replace(/\{\{FIRST_ROW\}\}/, index == 0 ? "order1" : "");
                });
                $("#list_in_050").prepend(tag);
                setListRowEvent();
            }
        });
    };

	// 리스트에 클릭 이벤트 등록
	var setListRowEvent = function(){
		$(".mLink").off("click","**");
		$(".mLink").on("click", function(){
			var ver_seq = $(this).data("id");
			if (ver_seq != undefined) {
				$(this).addClass("on");
				$(this).siblings("div").removeClass("on");
				screenManager.moveToPage("IN_051.html", {
					param: {
						VER_SEQ: M.sec.encrypt(ver_seq.toString()).result
					},
					action: 'NEW_SCR'
				});
			}
		})
	};

	var goPageRegist = function() {
		screenManager.moveToPage("IN_051.html", {
			action: 'NEW_SCR'
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