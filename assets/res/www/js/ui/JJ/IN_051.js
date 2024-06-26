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
    var C1_LIST = [];

	var m_scanMode = false;
	var objPartNumSelect;
	var objImageUploader01, objImageUploader02, objImageUploader03;
	var m_ver_seq = "";
	var m_PLANT_CD = "", m_LINE_CD = "", m_LINE_DT_CD = "", m_ISSUE_DT = "", m_ISSUE_TM = "", m_WORK_TP = "", m_WORK_LINE = ""
		, m_PART_NO = "", m_PART_NM = "", m_VEND_CD = "", m_VEND_NM = "", m_REASON = "", m_REASON_ETC = "", m_REASON_CONT = ""
		, m_FILE1 = "", m_FILE2 = "", m_FILE3 = "", m_HPT_EMP = "", m_VEND_EMP = "", m_REPAIR_BE_DT = "", m_REPAIR_COMPLETE_DT = ""
		, m_REG_EMP = "", m_UPDT_EMP = "", m_PART_TP = "";

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        m_ver_seq = dataManager.param('VER_SEQ');
		if (m_ver_seq == undefined) {m_ver_seq = "";}

		objPartNumSelect = new SelectListPopup({ title: "품번선택", id: "popPart", submitCallback: function(code, name, ext1){
			$("#txtPART_NO").val(code);
			$("#txtPART_NM").val(ext1);
			getVENDList();
		}});
		objPartNumSelect.init();

		objImageUploader01 = new ImageUploadPopup({id: "popUpload01", objAreaID: "imgUploader01" });
		objImageUploader02 = new ImageUploadPopup({id: "popUpload02", objAreaID: "imgUploader02" });
		objImageUploader03 = new ImageUploadPopup({id: "popUpload03", objAreaID: "imgUploader03" });

		if (m_ver_seq != ""){
			$("#btnDelete").parent().removeClass("blind");
			setLoadData();
		} else {
			var today = window.Utils.getTodayFormat("yyyy.MM.dd");
			$("#txtISSUE_DT").val(today);
			$("#txtISSUE_TM").val(window.Utils.getTodayFormat("HH:mm"));
			$("#txtREPAIR_BE_DT").val(today);
			$("#txtREPAIR_COMPLETE_DT").val(today);
			PlantReq();
			WorkTpReq();
			ReasonReq();

			objImageUploader01.init();
			objImageUploader02.init();
			objImageUploader03.init();
		}
	};

	// 이벤트 초기화
	var setInitEvent = function() {
	    $("#btnPartNumSearch").on("click", getPartNoList);

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

        $("#txtISSUE_DT").on("click", function(){
            window.Utils.getCalendar("txtISSUE_DT", null, null);
        });
        $("#txtISSUE_TM").on("click", function(){
            M.pop.date({type:"HM24", initDate: $("#txtISSUE_TM").val().replace(":","")}, function(result){
                if (result.status == "SUCCESS"){
                    $("#txtISSUE_TM").val(result.HH + ":" + result.mm);
                }
            });
        });
        $("#txtREPAIR_BE_DT").on("click", function(){
			window.Utils.getCalendar("txtREPAIR_BE_DT", null, null);
		});
		$("#txtREPAIR_COMPLETE_DT").on("click", function(){
            window.Utils.getCalendar("txtREPAIR_COMPLETE_DT", null, null);
        });
        // 플랜트 변경 시 반납창고 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq();
            SetLineDetailList();
        })
        $("#selVEND").on("change", function(){
            if ($(this).val() == "K"){
                $("#areaVEND_ETC").removeClass("blind");
            } else {
                if (!$("areaVEND_ETC").hasClass("blind"))
                    $("#areaVEND_ETC").addClass("blind");
            }
        });

        $("#selREASON").on("change", function(){
            if ($(this).val() == "9"){
                $("#areaREASON_ETC").removeClass("blind");
            } else {
                if (!$("#areaREASON_ETC").hasClass("blind"))
                    $("#areaREASON_ETC").addClass("blind");
            }
        });

        $("#btnScan1").on("click",getScanData);
        $("#btnSave").on("click", setSave);
	};

    // 스캔시 처리 함수
     var ScanValidation = function(inputScan) {
         if(inputScan.length > 0) {
            var qr_data = inputScan;
            var startIndex = qr_data.indexOf(":P");
            var endIndex = qr_data.indexOf(":5Q");
            var part_no = qr_data.substring(startIndex+2, endIndex);
            $("#txtPART_NO").val(part_no);

             getPartNoList();
         }
     }


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
                    if (m_PLANT_CD != ""){
                        $("#selPLANT_CD").val(m_PLANT_CD);
                    }
                    StorageLocationReq();
                    SetLineDetailList();
                }
            }
        });
    };

    // 발생시간간 콤박스 정보 조회
    var WorkTpReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_051_S2.do',
            data: {
                'event':'주/야간 콤보정보'
            },
            success: function(receivedData, setting) {
                $("#selWORK_TP").html("");
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += "<option value='" + rowData.CD + "'>" + rowData.NM + "</option>";
                });
                $("#selWORK_TP").prepend(tag);
                if (m_WORK_TP != ""){
                    $("#selWORK_TP").val(m_WORK_TP);
                }
            }
        });
    };

    // 원창 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': ['10']
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selLINE_CD").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLINE_CD").append(tag);
                if($("#selPLANT").val() == getWERKS) {
                    $("#selLINE_CD").val(getLGORT).prop("selected", true);
                }
                if (m_LINE_CD != ""){
                    $("#selLINE_CD").val(m_LINE_CD);
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
                'LINE_TYPE': '20'
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selLINE_DT_CD").html("");
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                     });
                }
                $("#selLINE_DT_CD").append(tag);
                if (m_LINE_DT_CD != ""){
                    $("#selLINE_DT_CD").val(m_LINE_DT_CD);
                }
            }
        });
    }

    // 발생시간 콤보박스 정보 조회
    var ReasonReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_051_S3.do',
            data: {
                'event':'적발사유 콤보 조회'
            },
            success: function(receivedData, setting) {
                $("#selREASON").html("");
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += "<option value='" + rowData.CD + "'>" + rowData.NM + "</option>";
                });
                $("#selREASON").prepend(tag);
                if (m_REASON != ""){
                    $("#selREASON").val(m_REASON);
                }
            }
        });
    };

    // 귀책처 콤보박스 정보 조회
    var getVENDList = function() {
        var part_no = $("#txtPART_NO").val();
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_051_S5.do',
            data: {
                'PART_NO':part_no,
                'event':'적발사유 콤보 조회'
            },
            success: function(receivedData, setting) {
                $("#selVEND").html("");
                var tag = "";
                $.each(receivedData.ListData, function(index,rowData){
                    tag += "<option value='" + rowData.VEND_CD + "'>" + rowData.VEND_NM + "</option>";
                });
                tag += "<option value=\"K\">KEY IN</option>";
                $("#selVEND").append(tag);
                if(receivedData.ListCount == 0){
                    $("#areaVEND_ETC").removeClass("blind");
                }
                if (m_VEND_CD != ""){
                    $("#selVEND").val(m_VEND_CD);
                }
            }
        });
    };

	var getPartNoList = function() {
		var part_no = $("#txtPART_NO").val();

		if (window.Utils.trim(part_no) == ""){
			popupManager.alert("한 글자 이상 입력 후 다시시도하세요.", {title:"확인"});
			return;
		}

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/IN_051_S4.do',
            data: {
                'PART_NO':part_no,
                'event':'품번 조회'
            },
            success: function(receivedData, setting) {
                objPartNumSelect.setDB(receivedData.ListData, "PART_NO", "PART_NM", "ONLY_PART_NM");
                objPartNumSelect.show();
            }
        });
	};

	var getScanData = function() {
        M.plugin('qr').open(function(rst) {
            if (rst.status == 'SUCCESS') {
                var qr_data = rst.result;
                // TODO : success code here
                //console.log(qr_data);
                var startIndex = qr_data.indexOf(":P");
                var endIndex = qr_data.indexOf(":5Q");
                var part_no = qr_data.substring(startIndex+2, endIndex);
                $("#txtPART_NO").val(part_no);
            } else {
                // TODO: cancel or fail code here
            }
        }, {
                'cancel' : '이전',
                'custom' : '',
                'customHtml' : '',
                'flashOn' : 'Flash ON',
                'flashOff' : 'Flash OFF',
                'menuAnimation' : 'ON', // ON, OFF
        });
	};

	// 저장
	var setSave = function() {
		var part_no = $("#txtPART_NO").val();								// 품번
		var part_nm = $("#txtPART_NM").val();								// 품명
		var vend_cd = $("#selVEND > option:selected").val();				// 업체코드
		var vend_nm = $("#selVEND > option:selected").text();				// 업체명
		var reason = $("#selREASON > option:selected").val();				// 적발사유 코드
		var reason_etc = $("#txtREASON").val();								// 적발사유에서 기타 선택시에 입력
		var reason_cont = $("#txtREASON_CONT").val();						// 적발내용
		var hpt_emp = $("#txtHPT_EMP").val();								// HPT 담당자 명
		var vend_emp = $("#txtVEND_EMP").val();								// 협력사 담당자 명

		if (vend_cd == "K")
			vend_nm = $("#txtVEND").val();

		// check validation
		if (!checkValidation(part_no, part_nm, vend_cd, vend_nm, reason, reason_etc, reason_cont, hpt_emp, vend_emp)){
			return;
		}

		// delete file check & delete call
		if (objImageUploader01.getIsDelete() == true || objImageUploader03.getIsDelete() == true || objImageUploader03.getIsDelete() == true){
			var delFile1 = objImageUploader01.getDelImageFileName();
			var delFile2 = objImageUploader02.getDelImageFileName();
			var delFile3 = objImageUploader03.getDelImageFileName();
			var filelist = "";

			if (delFile1 != null && delFile1 != ""){
				filelist += delFile1;
			}
			if (delFile2 != null && delFile2 != ""){
				if (filelist != "")
					filelist += ";";
				filelist += delFile2;
			}
			if (delFile3 != null && delFile3 != ""){
				if (filelist != "")
					filelist += ";";
				filelist = delFile3;
			}

			networkManager.httpSend({
				path: '/api/ImageFileDelete.do',
				data: {
					'FILE_LIST': filelist
				},
				success: function(receivedData, setting) {
					setFileUpload();
				}
			});
		} else {
			setFileUpload();
		}

	};

	var setFileUpload = function() {
		if (objImageUploader01.getIsChanged() == true || objImageUploader02.getIsChanged() == true || objImageUploader03.getIsChanged() == true) {

			var bodyFile = [];

			if (objImageUploader01.getIsChanged()){
				bodyFile.push({name:"file1", content: objImageUploader01.getImagePathName(), type: "FILE"});
			}

			if (objImageUploader02.getIsChanged()){
				bodyFile.push({name:"file2", content: objImageUploader02.getImagePathName(), type: "FILE"});
			}

			if (objImageUploader03.getIsChanged()){
				bodyFile.push({name:"file3", content: objImageUploader03.getImagePathName(), type: "FILE"});
			}

			M.net.http.upload({
				url: CONSTANT.NETWORK.UPLOAD_URL,
				header: {},
				params: {},
				body: bodyFile,
				encoding : "UTF-8",
				finish : function(statusCode, header, body, status, error) {
				    console.log("status : "+status);
				    console.log("statusCode : "+statusCode);
				    console.log("error : "+error);
					if (status == "SUCCESS"){
						//popupManager.instance('이미지 파일 업로드가 완료되었습니다.');
						setDatabaseMerge();
					} else {
						popupManager.instance('이미지 파일 업로드가 실패 하였습니다. 잠시 후 다시시도 하시기 바랍니다.\r\n' + error);
					}
				},
				progress : function(total, current) {
					console.log(total, current);
				}
			});
		} else {
			setDatabaseMerge();
		}
	};

	var setDatabaseMerge = function() {
		var plant_cd = $("#selPLANT > option:selected").val();			    // 공장
		var line_cd = $("#selLINE_CD > option:selected").val();				// 발생라인
		var line_dt_cd = $("#selLINE_DT_CD > option:selected").val();		// 발생라인(상세)
		var issue_dt = window.Utils.replaceAll($("#txtISSUE_DT").val(),".","");// 발생일자
		var issue_tm = window.Utils.replaceAll($("#txtISSUE_TM").val(),":","");// 발생시간
		var work_tp = $("#selWORK_TP > option:selected").val();				// 주간/야간
		//var work_line = $("#selWORK_LINE > option:selected").val();			// 조립/가동
		var part_no = $("#txtPART_NO").val();								// 품번
		var part_nm = $("#txtPART_NM").val();								// 품명
		var vend_cd = $("#selVEND > option:selected").val();				// 업체코드
		var vend_nm = $("#selVEND > option:selected").text();				// 업체명
		var reason = $("#selREASON > option:selected").val();				// 적발사유 코드
		var reason_etc = $("#txtREASON").val();								// 적발사유에서 기타 선택시에 따로 입력....
		var reason_cont = $("#txtREASON_CONT").val();						// 적발내용

		if (vend_cd == "K") {
			vend_nm = $("#txtVEND").val();
		}

		var file1 = objImageUploader01.getImageFileName();
		var file2 = objImageUploader02.getImageFileName();
		var file3 = objImageUploader03.getImageFileName();

		if (file1 == null) file1 = "";
		if (file2 == null) file2 = "";
		if (file3 == null) file3 = "";

		var hpt_emp = $("#txtHPT_EMP").val();								// HPT 담당자 명
		var vend_emp = $("#txtVEND_EMP").val();								// 협력사 담당자 명

		var repair_be_dt = window.Utils.replaceAll($("#txtREPAIR_BE_DT").val(),".","");// 개선예정일
		var repair_complete_dt = window.Utils.replaceAll($("#txtREPAIR_COMPLETE_DT").val(),".","");	// 개선완료일
		var driv_id = userManager.getUSER_ID();		// 작성자 아이디
        //var driv_id = userManager.getDRIV_ID();		// 작성자 아이디

        C1_LIST.push({"COPORATE_CD":getCORP_CD,
                      "PLANT_CD":plant_cd,
                      "LOC_TP":line_cd,
                      "LINE_CD":line_dt_cd,
                      "ISSUE_DT":issue_dt,
                      "ISSUE_TM":issue_tm,
                      "WORK_TP":work_tp,
                      "PART_NO":part_no,
                      "PART_NM":part_nm,
                      "VEND_CD":vend_cd,
                      "VEND_NM":vend_nm,
                      "REASON":reason,
                      "REASON_ETC":reason_etc,
                      "REASON_CONT":reason_cont,
                      "FILE1":file1,
                      "FILE2":file2,
                      "FILE3":file3,
                      "HPT_EMP":hpt_emp,
                      "VEND_EMP":vend_emp,
                      "REPAIR_BE_DT":repair_be_dt,
                      "REPAIR_COMPLETE_DT":repair_complete_dt,
                      "DRIV_ID":driv_id,
                      "RTN_MSG":""});
        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });


		networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_IN_051_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    C1_LIST.length = 0;
                    moveToBack();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    C1_LIST.length = 0;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                C1_LIST.length = 0;
            }
        });
	};

	var checkValidation = function(part_no, part_nm, vend_cd, vend_nm, reason, reason_etc, reason_cont, hpt_emp, vend_emp){
		if (window.Utils.trim(part_no) == "") {
			popupManager.alert("품번을 검색/선택하세요", {title: '알림'});
			return;
		}

		if (window.Utils.trim(part_nm) == "") {
			popupManager.alert("품번을 검색/선택하세요", {title: '알림'});
			return;
		}

		if (window.Utils.trim(vend_cd) == "") {
			popupManager.alert("귀책처를 선택하세요", {title: '알림'});
			return;
		}

		if (window.Utils.trim(vend_nm) == "") {
			popupManager.alert("귀책처 KEY IN을 입력하세요", {title: "알림"});
			return;
		}

		if (reason == "9"){
			if (window.Utils.trim(reason_etc) == "") {
				popupManager.alert("기타 적발사유를 입력하세요", {title: "알림"});
				return;
			}
		}

		if (window.Utils.trim(reason_cont) == "") {
			popupManager.alert("적발내용을 입력하세요", {title: '알림'});
			return;
		}

		if (window.Utils.trim(hpt_emp) == "") {
			popupManager.alert("HTS담당자를 입력하세요", {title: '알림'});
			return;
		}

		if (window.Utils.trim(vend_emp) == "") {
			popupManager.alert("협력사담당자를 입력하세요", {title: '알림'});
			return;
		}

		return true;
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