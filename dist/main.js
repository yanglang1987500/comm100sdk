

(function () {
	function get(id){
		return document.getElementById(id);
	}

	var kbdata = { "value": [] };
	//kbdata.value = kbdata.value.slice(0,15)
	var $list = get('kblist'),
		$tmp = get('tmpNode'),
		$pageSize = get('pageSize'),
		$keyWord = get('keyWord'),
		pageNum = 0, allPage = 0, maxFootNum = 5, count, titleMaxLength = 200,
		$pageContainer = get('page-container'),
		$pageMsg = get('pageMsg'),
		$detailTitle = get('detailTitle'),
		$detailContent = get('detailContent'),
		$clearBtn = get('clearBtn'),
		$searchBtn = get('searchBtn'),
		$detailView = get('detailView'),
		$listView = get('listView'),
		$backBtn = get('backBtn'),
		$btnLink = get('btnLink'),
		$btnContent = get('btnContent'),
		authContext = null,
		top = 0;
	var organizationURI = "https://comm100.crm3.dynamics.com/"; //The URL to connect to CRM (online)
	var tenant = "comm100corp.onmicrosoft.com"; //The name of the Azure AD organization you use
	var clientId = "1a302b4a-8c32-4e9e-9981-057d01c4103a"; //The ClientId you got when you registered the application
	var pageUrl = window.location.href.split('?')[0]; //The URL of this page in your development environment when debugging.
	var detailUrl = "https://www.canberra.edu.au/askuc/answer/?id=";

	function getUrlPara(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
		var r = window.location.search.substr(1).match(reg);
		if (r != null) return (r[2]); return null;
	}

	function init() {
		if(!authenticate())
			return;	
		loadData();
		bindEvents();
		
		render();
	}

	Comm100AgentConsoleAPI.onReady(function () {
			Comm100AgentConsoleAPI.init();
			init();
	});
	
	function authenticate() {
		var config = {
			popUp: Comm100AgentConsoleAPI.config.isWeb,
			callback: Comm100AgentConsoleAPI.config.isWeb? function () {
				get('noLoginContainer').style.display = 'none';
				init();
			}:null,
			tenant: tenant,
			clientId: clientId,
			postLogoutRedirectUri: pageUrl,
			endpoints: {
				orgUri: organizationURI
			},
			cacheLocation: 'sessionStorage', // enable this for IE, as sessionStorage does not work for localhost.
		};
		authContext = new AuthenticationContext(config);

		// Check For & Handle Redirect From AAD After Login
		var isCallback = authContext.isCallback(window.location.hash);
		if (isCallback) {
			authContext.handleWindowCallback();
		}
		var loginError = authContext.getLoginError();
 		if (isCallback && !loginError && !Comm100AgentConsoleAPI.config.isWeb) {
    	window.location = authContext._getItem(authContext.CONSTANTS.STORAGE.LOGIN_REQUEST);
   	}
		user = authContext.getCachedUser();
		if (!user) {
			get('authloginBtn').addEventListener('click', function () {
				authContext.login();
			});
			get('noLoginContainer').style.display = 'block';
			get('authloginBtn').removeAttribute('disabled')
			setTimeout(function () {
				get('loading').style.display = 'none';
			});
			return false;
		}
		get('normalContainer').style.display = 'block';
		return true;
	}

	function loadData() {
		authContext.acquireToken(organizationURI, receiveData);
	}

	function receiveData(error, token, errorType) {
		get('loading').style.display = 'block';
		if (error || !token) {
			console.log('ADAL error occurred: ' + error);
			setTimeout(function(){
				if(errorType === 'login_required'){
					authContext.clearCache();
					window.location = window.location;
				}
				loadData();
			})
			return;
		}

		var req = new XMLHttpRequest()
		req.open("GET", encodeURI(organizationURI + "/api/data/v8.1/knowledgearticles?$select=content,title,knowledgearticleid&$filter=statuscode eq 7"), true);
		//Set Bearer token
		req.setRequestHeader("Authorization", "Bearer " + token);
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.onreadystatechange = function () {
			if (this.readyState == 4 /* complete */) {
				req.onreadystatechange = null;

				get('loading').style.display = 'none';
				if (this.status == 200) {
					kbdata.value = JSON.parse(this.responseText).value;
					render();
				}else if(this.response){
					var error = JSON.parse(this.response).error;
					console.log(error.message);
				}else{
					console.log('fetch data failed');
				}
			}
		};
		req.send();
	}

	/**
	 * @method {{bindEvents}} 
	 * @return {[type]} [description]
	 */
	function bindEvents() {
		var keyup = function () {
			pageNum = 0;
			render();
		}, _keyup = debounce(function () {
			pageNum = 0;
			render();
		}, 300)
		$pageSize.addEventListener('change', keyup);
		$keyWord.addEventListener('keyup', _keyup);
		$keyWord.addEventListener('input', function(){
			if($keyWord.value.length>0)
				$clearBtn.style.display = 'block';
			else
				$clearBtn.style.display = 'none';
		});
		$clearBtn.addEventListener('click', function () {
			$keyWord.value = '';
			$clearBtn.style.display = 'none';
			keyup();
		});
		$searchBtn.addEventListener('click', function () {
			keyup();
		});
		$list.addEventListener('click', function (e) {
			var target = e.target || e.srcElement, id, data;
			if (target.parentNode.parentNode.nodeName === 'LI') {
				id = target.parentNode.parentNode.getAttribute('data-id');
				data = findData(id);
			}
			if (target.nodeName === 'H3' && target.className === '') {
				id = target.parentNode.getAttribute('data-id');
				data = findData(id);
				top = window.document.body.scrollTop;
				$detailTitle.innerHTML = data.title;
				$detailContent.innerHTML = unescapeHTML(data.content);
				$btnLink.setAttribute('data-id', id);
				$btnContent.setAttribute('data-id', id);
				$listView.style.display = 'none';
				$detailView.style.display = 'block';
				scrollTo(0,0);
			} else if (target.nodeName === 'I' && target.className === 'btn-link') {
				Comm100AgentConsoleAPI.do('agentconsole.currentChat.input', detailUrl + id);
			} else if (target.nodeName === 'I' && target.className === 'btn-content') {
				Comm100AgentConsoleAPI.do('agentconsole.currentChat.input', createTextVersion(unescapeHTML(formatHtml(data.content))));
			}
		});
		$backBtn.addEventListener('click', function (e) {
			$listView.style.display = 'block';
			$detailView.style.display = 'none';
			scrollTo(0,top);
		});
		$pageContainer.addEventListener('click', function (e) {
			var target = e.target || e.srcElement, prevBtn = get('prevBtn'), nextBtn = get('nextBtn');
			if (target.nodeName === 'LI' && target.className === '') {
				if(target.getAttribute('disabled')==='disabled')
					return;
				var isPrev = target.getAttribute('id') === 'prevBtn';
				pageNum = isPrev? pageNum -1:pageNum+1;
				render();
				
			}
		});
		$pageContainer.addEventListener('selectstart', function (e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		$btnLink.addEventListener('click', function (e) {
			var id = this.getAttribute('data-id'), data = findData(id);
			Comm100AgentConsoleAPI.do('agentconsole.currentChat.input', detailUrl + id);
		});
		$btnContent.addEventListener('click', function (e) {
			var id = this.getAttribute('data-id'), data = findData(id);
			Comm100AgentConsoleAPI.do('agentconsole.currentChat.input', createTextVersion(unescapeHTML(formatHtml(data.content))));
		});
	}



	/**
	 * @method {{render}} 
	 * @return {[type]} [description]
	 */
	function render() {
		var data = doFilter();
		var html = '';
		for (var i = 0; i < data.length; i++) {
			var content = unescapeHTML(html2Text(data[i].content));
			html += '<li data-id="' + data[i].knowledgearticleid + '">\
			<h3>'+ data[i].title + '</h3>\
			<p>'+ (content.length >= titleMaxLength ? content.substr(0, titleMaxLength) + '...' : content) + '</p>\
			<div class="btn-right-container">\
				<i class="btn-link"></i>\
				<i class="btn-content"></i>\
			</div>\
			</li>';
		}
		$list.innerHTML = html;

		var footHtml = '';
		for (var i = 1; i <= allPage; i++) {
			if (pageNum < (maxFootNum - 1)) {
				if (i <= maxFootNum || i == allPage) {
					footHtml += i == (pageNum + 1) ? '<li class="selected">' + i + '</li>' : '<li>' + i + '</li>';
				}
				if (i == (maxFootNum + 1))
					footHtml += '<span>...</span>';
			} else if (pageNum >= (allPage - (maxFootNum - 1))) {
				if (i == 1 || i >= (allPage - (maxFootNum - 1))) {
					footHtml += i == (pageNum + 1) ? '<li class="selected">' + i + '</li>' : '<li>' + i + '</li>';
				}
				if (i == 2)
					footHtml += '<span>...</span>';
			} else {
				if (i == 1 || i == pageNum || i == pageNum + 1 || i == pageNum + 2 || i == allPage) {
					footHtml += i == (pageNum + 1) ? '<li class="selected">' + i + '</li>' : '<li>' + i + '</li>';
				}
				if (i == (pageNum - 1) || i == (pageNum + 3))
					footHtml += '<span>...</span>';
			}

		}
		//$pageContainer.innerHTML = footHtml;
		var pageSize = parseInt($pageSize.value);

		$pageMsg.innerHTML = '' + (function () {
			var min = (pageNum * pageSize + 1);
			if (count == 0 || min > count)
				return count;

			return min;
		})() + '-' + (function () {
			var max = (pageNum + 1) * pageSize;
			if (count < max)
				return count;
			return max;
		})() + ' of ' + count ;
		
		prevBtn.removeAttribute('disabled','disabled');
		nextBtn.removeAttribute('disabled','disabled');
		if(data.length == 0){
			prevBtn.setAttribute('disabled','disabled');
			nextBtn.setAttribute('disabled','disabled');
			return;
		}
		if(pageNum == 0){
			prevBtn.setAttribute('disabled','disabled');
		}else{
			prevBtn.removeAttribute('disabled','disabled');
		}
		if(pageNum == allPage-1){
			nextBtn.setAttribute('disabled','disabled');
		}else{
			nextBtn.removeAttribute('disabled','disabled');
		}
	}

	/**
	 * @method {{doFilter}}
	 * @return {[type]} [description]
	 */
	function doFilter() {
		var tmpData = [], data = kbdata.value;
		var key = $keyWord.value;
		if (key.trim() != '')
			for (var i = 0; i < data.length; i++) {
				if ((data[i].content && data[i].content.toUpperCase().indexOf(key.toUpperCase()) != -1) || (data[i].title && data[i].title.toUpperCase().indexOf(key.toUpperCase()) != -1))
					tmpData.push(data[i]);
			}
		else
			tmpData = JSON.parse(JSON.stringify(data));
		var pageSize = parseInt($pageSize.value);
		count = tmpData.length;
		allPage = Math.ceil(tmpData.length / pageSize);
		if (pageSize > tmpData.length)
			return tmpData;
		return tmpData.slice(pageNum * pageSize, (pageNum + 1) * pageSize);
	}

	/**
	 * @method {{findData}} 
	 * @param  {[type]} id [description]
	 * @return {[type]}    [description]
	 */
	function findData(id) {
		var data = kbdata.value;
		for (var i = 0; i < data.length; i++) {
			if (data[i].knowledgearticleid == id)
				return data[i];
		}
	}

	/**
	 * @method {{html2Text}} 
	 * @param  {[type]} html [description]
	 * @return {[type]}      [description]
	 */
	function html2Text(html) {
		$tmp.innerHTML = html;
		return $tmp.innerText;
	}

	function formatHtml(html){
		$tmp.innerHTML = html;
		return $tmp.innerHTML;
	}
	function unescapeHTML(a){
     	var a = "" + a;
     	return a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  	}

	function debounce(func, wait, immediate) {
		var timeout, args, context, timestamp, result;

		var later = function () {
			var last = Date.now() - timestamp;

			if (last < wait && last >= 0) {
				timeout = setTimeout(later, wait - last);
			} else {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
					if (!timeout) context = args = null;
				}
			}
		};
		return function () {
			context = this;
			args = arguments;
			timestamp = Date.now();
			var callNow = immediate && !timeout;
			if (!timeout) timeout = setTimeout(later, wait);
			if (callNow) {
				result = func.apply(context, args);
				context = args = null;
			}

			return result;
		};
	}
})();
