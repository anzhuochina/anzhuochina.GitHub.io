/**
 * HTML5 Audio Visualizer Player HTML5音乐可视化播放器
 * 
 * @版本号:1.4.0
 * @Author：PoppinRubo
 * @Github：https://github.com/PoppinRubo/HTML5VisualizationPlayer
 * @License: MIT
 */

// 创建一个对象方法
function Player() {
	// 程序运行数据
	var minew = {};
	// 播放获取进度信息时间计时器
	var timer;
	// 加载超时计时
	var overtime;
	// 先把自己用变量储存起来,后面要用
	var myself = this;
	// 默认设置
	myself.button = { // 设置生成的控制按钮,默认开启
		prev: true, // 上一首
		play: true, // 播放,暂停
		next: true, // 下一首
		volume: true, // 音量
		progressControl: true, // 进度控制
		settings: true, // 设置按钮
		add: true, // 添加按钮
		menu: true // 菜单控制
	}

	myself.analyser = null;

	// 定义事件默认空方法
	myself.event = function(e) {
		// 未设置事件方法就默认执行空方法
	}
	// 能量传出方法默认空方法
	myself.energy = function(v) {
		// 未设置能量传出就默认执行空方法
	}

	// @TODO 播放
	myself.executePlay = function(row, bln) {
		row = row || 0;
		if (isNaN(row) || row < 0 || row >= myself.playList.length)
			return;
		var file = myself.playList[row].mp3;
		// a.如果是网络路径：
		if(typeof(file)=='string' && file.indexOf('data:')==-1){
			myself.audio.src = file;
			return bln ? play() : false;
		}
		// b.如果是file资源：
		var callback = function(result) {
			// 媒体url信息更新
			myself.audio.src = result;// readAsBinaryString
			return bln ? play() : false;
		}
		myself.fileReader.onloadend = function(e) {
			return callback(e.target.result);
		};
		myself.fileReader.readAsDataURL(file);// readAsText/readAsDataURL/readAsBinaryString
	}

	// 频谱配置初始化,外部调用就开始进行处理
	this.init = function(object) {
		myself.playList = object.playList || [];
		myself.error = object.error || null;

		myself.elem = initElement(object.elem, document.getElementsByTagName("player"));
		if (!myself.elem)
			myself.error && myself.error('Player', 'player elem is null.');
		myself.elem.className = 'player-audio';
		myself.elem.innerHTML = '<div class="play-box"><div class="player"></div><div class="player-tips"></div></div>';
		myself.playerElem = myself.elem.getElementsByClassName('player')[0];

		myself.autoPlay = object.autoPlay || false;
		myself.event = object.event || myself.event;
		myself.energy = object.energy || myself.energy;
		myself.button = object.button || myself.button;
		myself.color = object.color || null;
		myself.showAdd = object.showAdd == false ? false : true; // 默认打开添加框
		myself.addFiles = object.addFiles || null;
		myself.showSettings = object.showSettings || null;
		myself.showDataList = object.showDataList || null;
		myself.loopMode = object.loopMode || 0; // 循环模式0列表循环
		myself.effect = object.effect || 0; // 默认随机,效果为0表示随机切换效果
		// 记录是否处理过音频,保证createMediaElementSource只创建一次,多次创建会出现错误
		myself.handle = 0;
		createParts();
	}
	
	// 重播
	this.replay = function() {
		myself.executePlay(myself.nowPlay, true);
	}
	
	// 获取播放列表
	this.getList = function() {
		return myself.playList;
	}
	this.clearList = function() {
		myself.playList = [];
	}

	// 去除重复的
	this.removeListRepeat = function() {
		var _map = {}, _array = myself.playList || [];
		for (var i = 0; i < array.length; i++) {
			var object = array[i];
			if (!object || !object.title)
				continue;
			var title = object.title;
			if (_map[title]) continue;
			_map[title] = true;
			_array.push(object);
		}
		_map = null;
		return myself.playList = _array;
	}

	// 追加列表
	this.appendList = function(array) {
		if(!array || !(array instanceof Array) || array.length<1)
			return false;
		myself.playList = myself.playList || [];
		for (var k in array)
			myself.playList.push(array[k]);
		return true;
	}

	// 改变效果
	this.change = function(object) {
		myself.effect = object.effect || 0;
		myself.color = object.color || null;
		console.log('频谱效果：', object);
		drawSpectrum(myself.analyser);
	}

	function initElement(elem, defElem) {
		defElem = (!defElem || defElem.length < 1) ? defElem : defElem[0];
		if (!elem)
			return defElem;
		if (typeof (elem) == 'string') {
			elem = elem.replace(/\.|#/g, '');
			var _elem = document.getElementById(elem);
			if (!_elem) {
				_elem = document.getElementsByClassName(elem);
				_elem = _elem ? _elem[0] : null;
			}
			return _elem || defElem;
		}
		return _elem || defElem;
	}

	// 实例化一个音频类型window.AudioContext
	function windowAudioContext() {
		// 下面这些是为了统一Chrome和Firefox的AudioContext
		window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
		window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
		window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
		try {
			myself.fileReader = new FileReader();
		} catch (e) {
			myself.error && myself.error('FileReader', e);
			console.error('您的浏览器不支持 FileReader,信息:' + e);
		}
		try {
			myself.audioContext = new AudioContext();
		} catch (e) {
			myself.error && myself.error('AudioContext', e);
			console.error('您的浏览器不支持 AudioContext,信息:' + e);
		}
	}

	// 创建播放部件
	function createParts() {
		// 创建audio
		var audio = document.createElement("AUDIO");
		audio.crossOrigin = 'anonymous';
		var player = myself.playerElem;
		player.className = 'visualizer-player';
		player.appendChild(audio);
		myself.player = player;
		myself.audio = audio;

		// 音乐部件
		var songInfo = document.createElement("div");
		var control = document.createElement("div");
		var playerShow = document.createElement("div");
		var playerTime = document.createElement("div");
		var progress = document.createElement("div");
		var playerProgressBar = document.createElement("div");
		var menus = document.createElement("div");
		songInfo.className = 'song-info';
		control.className = 'player-control';
		playerShow.className = 'player-show';
		playerTime.className = 'player-time';
		progress.className = 'progress';
		playerProgressBar.className = 'player-progress-bar';
		menus.className = 'player-menus';
		player.appendChild(songInfo);
		player.appendChild(control);
		player.appendChild(playerShow);
		player.appendChild(menus);
		playerShow.appendChild(playerTime);
		playerShow.appendChild(progress);
		progress.appendChild(playerProgressBar);

		myself.songInfo = songInfo;
		myself.progress = progress;
		myself.playerProgressBar = playerProgressBar;
		myself.menus = menus;

		// 创建控制按钮
		var button = myself.button;
		// 创建画布
		var canvas = document.createElement("canvas");
		canvas.height = 450;
		canvas.width = player.clientWidth;
		canvas.style.bottom = player.clientHeight + 'px';
		player.appendChild(canvas);
		myself.canvas = canvas;

		if (button.prev) {
			// 上一首,按钮创建
			var prevBtn = document.createElement('i');
			prevBtn.className = "icon-previous";
			prevBtn.id = "playPrev";
			prevBtn.title = "上一首";
			prevBtn.innerHTML = "&#xea23;";
			control.appendChild(prevBtn);
			// 上一首,控制
			var playPrev = document.getElementById("playPrev");
			playPrev.onclick = function() {
				prev();
			}
		}
		if (button.play) {
			// 播放,暂停,按钮创建
			var playBtn = document.createElement('i');
			playBtn.className = "icon-play";
			playBtn.id = "playControl";
			playBtn.title = "播放";
			playBtn.innerHTML = "&#xea1c;";
			playBtn.setAttribute('data', 'pause');
			control.appendChild(playBtn);
			// 播放,暂停,控制
			var playControl = document.getElementById("playControl");
			playControl.onclick = function() {
				play();
			}
		}
		if (button.next) {
			// 下一首,按钮创建
			var nextBtn = document.createElement('i');
			nextBtn.className = "icon-next";
			nextBtn.id = "playNext";
			nextBtn.title = "下一首";
			nextBtn.innerHTML = "&#xea24;";
			control.appendChild(nextBtn);
			// 下一首,控制
			var playNext = document.getElementById("playNext");
			playNext.onclick = function() {
				next();
			}
		}
		if (button.volume) {
			// 按钮与音量控制条容器
			var volumeBox = document.createElement('div');
			volumeBox.id = "volumeBox";
			control.appendChild(volumeBox);
			// 音量,按钮创建
			var volumeBtn = document.createElement('i');
			volumeBtn.className = "icon-volume";
			volumeBtn.id = "playVolume";
			volumeBtn.title = "音量";
			if (playBtn) {
				playBtn.setAttribute('data', 'normal');
			}
			volumeBtn.innerHTML = "&#xea27;";
			volumeBox.appendChild(volumeBtn);
			// 音量控制条
			var volumeBar = document.createElement('div');
			volumeBar.id = "volumeBar";
			volumeBox.appendChild(volumeBar);

			var volumeSize = document.createElement('div');
			volumeSize.id = "volumeSize";
			volumeBar.appendChild(volumeSize);

			volumeBar.onclick = function(event) {
				volumeChange(event, volumeBar, volumeSize);
			}

			// 音量,点击控制,静音-恢复
			var volumeBtn = document.getElementById("playVolume");
			volumeBtn.onclick = function() {
				volume();
			}
		}

		// 显示时间容器
		playerTime.innerHTML = "00:00&nbsp;/&nbsp;00:00&nbsp;&nbsp;&nbsp;&nbsp;0%";
		myself.playerTime = playerTime;

		// 进度条
		if (myself.button.progressControl) {
			var progress = myself.progress;
			progress.style.cursor = "pointer";
			progress.onclick = function(event) {
				progressControl(event, progress);
			}
		}

		// 设置按钮：
		minew.menus_settings = 'menus_settings';
		if (myself.button.settings) {
			var menu = document.createElement('i');
			menu.className = "icon-settings menus-settings";
			menu.id = minew.menus_settings;
			menu.title = "设置";
			menu.innerHTML = "&#xe61a;";
			menus.appendChild(menu);
			menu = document.getElementById(minew.menus_settings);
			menu.onclick = function(e) {
				// @TODO 显示设置（刷新，循环模式，下载，切换模式，more）
				myself.showSettings ? myself.showSettings(minew.menus_settings) : showSettings(minew.menus_settings);
			}
		}

		// 添加按钮：
		var _upfilesId = myself.upfilesId = 'lv-upfiles';
		if (myself.button.add) {
			var add = document.createElement('i');
			add.className = "icon-add menus-add";
			add.id = "menus_add";
			add.title = "添加";
			add.innerHTML = "&#xe624;";
			menus.appendChild(add);
			add = document.getElementById("menus_add");
			add.onclick = function() {
				return myself.addFiles ? myself.addFiles(_upfilesId) : addFiles(_upfilesId);
			}
		}
		if (myself.showAdd || myself.button.menu) {
			var add = window.document.createElement("div");
			add.className = _upfilesId;
			add.id = _upfilesId;
			add.innerHTML = '<div class="center"><input type="file" id="lv-upfiles-input" multiple="multiple"/><div class="text">点击选择本地文件</div></div><div class="mask"></div>';
			window.document.getElementsByTagName("HTML")[0].appendChild(add);
			//
			var upfiles = document.getElementById("lv-upfiles-input");
			upfiles.onchange = addFilesAfter;
			// 打开
			if (myself.showAdd)
				myself.addFiles ? myself.addFiles(_upfilesId) : addFiles(_upfilesId);
		}

		// 菜单按钮：
		minew.menus_menu = 'menus_menu';
		if (myself.button.menu) {
			var menu = document.createElement('i');
			menu.className = "icon-menus menus-menu";
			menu.id = minew.menus_menu;
			menu.title = "列表";
			menu.innerHTML = "&#xe61b;";
			menus.appendChild(menu);
			menu = document.getElementById(minew.menus_menu);
			menu.onclick = function(e) {
				myself.showDataList ? myself.showDataList(minew.menus_menu) : showDataList(minew.menus_menu);
			}
		}

		// 调用实例化AudioContext
		windowAudioContext();

		// 歌曲信息,创建
		var songTitle = document.createElement('div');
		songTitle.id = "songTitle";
		songInfo.appendChild(songTitle);

		var album = document.createElement('div');
		album.id = "album";
		songInfo.appendChild(album);

		var span = document.createElement('span');
		span.innerHTML = '-';
		songInfo.appendChild(span);
		myself.division = span;

		var artist = document.createElement('div');
		artist.id = "artist";
		songInfo.appendChild(artist);

		// 记录当前播放在数组里的位置
		myself.nowPlay = 0;
		// 信息设置
		updates();
		// 获取存储音量
		myself.audio.volume = volumeGetCookie();

		myself.executePlay(myself.nowPlay, myself.autoPlay);
		
		addEventListener();
	}
	
	function getNodeByIds(e, id1, id2){
		while (true) {
			if(e.id){
				if(e.id==id1 || e.id==id2) 
					return e;
			}
			if (e.nodeName == 'body' || !e.parentNode)
				return null;
			e = e.parentNode;
		}
		return null;
	}
	
	function addEventListener(){
		document.onclick = function(e) {
			e = e.target;
			if(e.id==minew.menus_settings){
				// 1-1.关闭B窗口
				if(minew.listing)
					minew.listing.style.display = 'none';
				return true;
			}
			if(e.id==minew.menus_menu){
				// 1-1.关闭A窗口
				if(minew.settings)
					minew.settings.style.display = 'none';
				return true;
			}
			if(getNodeByIds(e, minew.listing?minew.listing.id:'', minew.settings?minew.settings.id:'')){
				// console.log('点击了弹框内部...');
				return true;
			}
			if(minew.listing)
				minew.listing.style.display = 'none';
			if(minew.settings)
				minew.settings.style.display = 'none';
			return true;
		}
	}

	// @TODO 显示设置（刷新，循环模式，下载，切换模式，more）
	function showSettings() {
		// 创建
		var id = 'lv-settings', div = document.getElementById(id);
		if (!div) {
			div = window.document.createElement("div");
			div.className = 'lv-audio-dropdown ' + id;
			div.id = id;
			div.style.display = 'none';
			window.document.getElementsByTagName("HTML")[0].appendChild(div);
			minew.settings = div;
		}
		if (div.style.display != 'none') {
			div.style.display = 'none';
			return;
		}
		// 数据+事件
		resetSettings();
		// 显示位置
		div.style.display = 'block';
		var width = 280;
		div.style.width = width + 'px';
		var h = div.offsetHeight;    // 返回元素的总高度
		var menu = document.getElementById(minew.menus_settings);
		var weizhi = getOffset(menu);
		div.style.top = Number(weizhi.top) - Number(h) - 10 + 'px';
		div.style.left = Number(weizhi.left) - Number(width) * 0.5 + Number(menu.offsetWidth) * 0.5 + 'px';
	}

	// @TODO 显示设置（刷新，循环模式，下载，切换模式，more）
	function resetSettings() {
		// 数据
		var div = minew.settings;
		if (!div) return;
		var html = [];
		html.push('<div class="title">基础功能：</div>');
		html.push('<div class="lv-settings-item lv-settings-base">');
		html.push('<a href="javascript:void(0);" data-key="replay">重播</a>');
		html.push('<a href="javascript:void(0);" data-key="download">下载</a>');
		html.push('<a href="javascript:void(0);" data-key="reload">刷新页面</a>');
		html.push('<a href="javascript:void(0);" data-key="clear">清空列表</a>');
		html.push('</div>');
		html.push('<div class="title">循环模式：</div>');
		html.push('<div class="lv-settings-item lv-settings-xunhuan">');
		html.push('<div><input type="radio" name="xunhuan" value="0" ' + (myself.loopMode == 0 ? 'checked' : '') + '>列表循环</div>');
		html.push('<div><input type="radio" name="xunhuan" value="1" ' + (myself.loopMode == 1 ? 'checked' : '') + '>顺序播放</div>');
		html.push('<div><input type="radio" name="xunhuan" value="2" ' + (myself.loopMode == 2 ? 'checked' : '') + '>单曲循环</div>');
		html.push('<div><input type="radio" name="xunhuan" value="3" ' + (myself.loopMode == 3 ? 'checked' : '') + '>随机播放</div>');
		html.push('</div>');
		// 频谱效果,不设置或0为随机变化,1为条形柱状,2为环状声波,3 心电图效果
		html.push('<div class="title">频谱效果：</div>');
		html.push('<div class="lv-settings-item lv-settings-qupu">');
		html.push('<div><input type="radio" name="qupu" value="0" ' + (myself.effect == 0 ? 'checked' : '') + '>自动/随机</div>');
		html.push('<div><input type="radio" name="qupu" value="1" ' + (myself.effect == 1 ? 'checked' : '') + '>条形柱状</div>');
		html.push('<div><input type="radio" name="qupu" value="2" ' + (myself.effect == 2 ? 'checked' : '') + '>环状声波</div>');
		html.push('<div><input type="radio" name="qupu" value="3" ' + (myself.effect == 3 ? 'checked' : '') + '>心电图效果</div>');
		html.push('</div>');
		html.push('');
		div.innerHTML = html.join('\n');

		// 事件1.基础功能
		var bases = div.getElementsByClassName('lv-settings-base')[0].children;
		for (var i = 0; i < bases.length; i++) {
			var base = bases[i];
			base.onclick = function() {
				var key = this.getAttribute('data-key');
				if (key == 'reload')// 刷新页面
					return window.location.reload(true);
				if (key == 'download')// 下载
					return downPlayFile();
				if (key == 'replay')// 重播
					return myself.replay();
				if (key == 'clear')// 清空列表
					return myself.playList = [];
			}
		}
		// 事件2.循环播放
		var xunhuans = div.getElementsByClassName('lv-settings-xunhuan')[0].children;
		for (var i = 0; i < xunhuans.length; i++) {
			var xunhuan = xunhuans[i].children[0];
			xunhuan.onclick = function() {
				console.log('循环播放：', this.value);
				myself.loopMode = parseInt(this.value);
			}
		}
		// 事件3.曲谱效果
		var qupus = div.getElementsByClassName('lv-settings-qupu')[0].children;
		for (var i = 0; i < qupus.length; i++) {
			var qupu = qupus[i].children[0], bln = false;
			qupu.onclick = function() {
				console.log('频谱效果改变：', this.value, this);
				if (myself.analyser != null){
					myself.change({ 
						effect: parseInt(this.value)
					});
				}
			}
		}
	}
	
	function downPlayFile(){
		// var uri = myself.playList[myself.nowPlay];
		if(!myself.audio.src)
			return alert('无数据！');
		// "data:audio/mpeg;base64,
		var jdata = myself.playList[myself.nowPlay];
		var title = jdata ? jdata.title : (new Date().getTime()+'.mp3');
		
		var dlink = window.document.createElement("a");
		dlink.setAttribute('href', myself.audio.src);
		dlink.setAttribute('download', title);
		dlink.style.display = 'none';
		myself.elem.appendChild(dlink);
		dlink.click();
		dlink.parentNode.removeChild(dlink);
	}
	
	function showDataList() {
		// 创建
		var id = 'lv-audio-list', audios = document.getElementById(id);
		if (!audios) {
			audios = window.document.createElement("div");
			audios.className = 'lv-audio-dropdown ' + id;
			audios.id = id;
			audios.style.display = 'none';
			window.document.getElementsByTagName("HTML")[0].appendChild(audios);
			minew.listing = audios;
		}
		if (audios.style.display != 'none') {
			audios.style.display = 'none';
			return;
		}
		// 数据+事件
		resetDataList();
		// 显示位置
		audios.style.display = 'block';
		var width = 260;
		audios.style.width = width + 'px';
		var h = audios.offsetHeight;    // 返回元素的总高度
		var menu = document.getElementById(minew.menus_menu);
		var weizhi = getOffset(menu);
		audios.style.top = Number(weizhi.top) - Number(h) - 10 + 'px';
		audios.style.left = Number(weizhi.left) - Number(width) + Number(menu.offsetWidth) + 'px';
	}

	function resetDataList() {
		// 数据
		var audios = minew.listing;
		if (!audios) return;
		var list = myself.playList || [], html = [];
		if(list.length<1)
			html.push('<div class="lv-empty"><center>暂无数据.</center></div>');
		for (var i = 0; i < list.length; i++) {
			var jdata = list[i] || {};
			var title = jdata.title || '', artist = jdata.artist || '';
			html.push('<div class="lv-audio-item ' + (i == myself.nowPlay ? 'selected' : '') + '" data-row="' + i + '" title="点击播放：' + title
				+ '(' + artist + ')">' + fillstring(i + 1) + '. ' + title + '</div>');
		}
		audios.innerHTML = html.join('\n');

		// 事件
		var items = audios.getElementsByClassName('lv-audio-item');
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			if (!item || !item.nodeType) continue;
			item.onclick = function() {
				var row = this.getAttribute('data-row');
				myself.playByRow(row);
				audios.style.display = 'none';
			}
		}
		var empty = audios.getElementsByClassName('lv-empty');
		if(empty && empty.length>0){
			empty[0].onclick = function() {
				myself.addFiles ? myself.addFiles(myself.upfilesId) : addFiles(myself.upfilesId);
				audios.style.display = 'none';
			}
		}
	}

	function fillstring(str) {
		return str && str.toString().length == 1 ? ("0" + str) : str;
	}

	function getOffset(Node, offset) {
		if (!offset) {
			offset = {};
			offset.top = 0;
			offset.left = 0;
		}
		if (Node == document.body) // 当该节点为body节点时，结束递归
			return offset;
		offset.top += Node.offsetTop;
		offset.left += Node.offsetLeft;
		return getOffset(Node.parentNode, offset);// 向上累加offset里的值
	}

	// 添加
	function addFiles(upfilesId) {
		var upfiles = document.getElementById(upfilesId);
		if (!upfiles) return console.error('upfilesId is not elem.');
		var upClassName = upfiles.className;
		upfiles.setAttribute('data', upClassName);
		upfiles.className = upClassName + ' upfiles-fixed';
		upfiles.children[0].children[1].onclick = function() {
			var fnElm = window.document.getElementById("lv-upfiles-input");
			if (!fnElm) return;
			fnElm.click();
			minew.selectFile = true;
		}

		var cancel = upfiles.getElementsByTagName('p');
		if (!cancel || cancel.length < 1) {
			cancel = document.createElement('p');
			cancel.className = "upfiles-cancel";
			cancel.title = "关闭";
			cancel.innerHTML = "关闭";
			upfiles.children[0].appendChild(cancel);
		} else {
			cancel = cancel[0];
		}
		cancel.onclick = function() {
			upfiles.className = upClassName;
		}
	}

	function addFilesAfter() {
		var fnElm = window.document.getElementById("lv-upfiles-input");
		if (!fnElm || !fnElm.files) return console.log('not files.');
		myself.playList = myself.playList || [];
		minew.emptyCn = (minew.emptyCn || 0) + (myself.playList.length == 0 ? 1 : 0);
		for (var i in fnElm.files) {
			var obj = {}, file = fnElm.files[i];
			if (!file || !file.size || file.size < 1)
				continue;
			obj.title = file.name;
			obj.artist = renderSize(file.size);
			obj.size = file.size;
			obj.mp3 = file;
			myself.playList.push(obj);
		}
		if (myself.playList.length == 0)
			return;
		// 事件传出
		myself.event({
			eventType: "addFiles",
			describe: "添加列表"
		});
		console.log(myself.playList);

		// 记录当前播放在数组里的位置
		myself.nowPlay = myself.nowPlay || 0;
		// 信息设置
		updates();

		// 是选择文件进来的，需要隐藏弹框：
		if (minew.selectFile) {
			minew.selectFile = false;
			(function() {
				var upfiles = document.getElementById(myself.upfilesId);
				if (!upfiles) return;
				upfiles.className = upfiles.getAttribute('data');
			})();
			console.log("myself.audio.paused==", myself.audio.paused);
		}

		// 第一次列表是空的，就播放：
		if (minew.emptyCn == 1) {
			myself.executePlay(myself.nowPlay, myself.autoPlay);
		}
	}

	// 格式化文件大小
	function renderSize(value) {
		if (null == value || value == '')
			return "0 Bytes";
		var unitArr = new Array("Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");
		var index = 0;
		var srcsize = parseFloat(value);
		index = Math.floor(Math.log(srcsize) / Math.log(1024));
		var size = srcsize / Math.pow(1024, index);
		size = size.toFixed(2);// 保留的小数位数
		return size + unitArr[index];
	}
	myself.renderSize = renderSize;

	// 播放,暂停 控制
	function play() {
		var playBtn = document.getElementById("playControl");
		// 播放控制
		if (myself.audio.paused) {
			var playing = myself.audio.play();
			playing.then(function() {
				// 字符图标变化
				if (playBtn) {
					playBtn.setAttribute("data", "play");
					playBtn.title = "暂停";
					playBtn.innerHTML = "&#xea1d;";
				}
				timer = setInterval(function() {
					// 显示时长
					showTime();
					// 获取就绪状态并处理相应
					playerState();
				}, 1000);
				// 播放媒体信息更新
				updates();
				// 处理播放数据,处理过就不再处理
				if (myself.handle == 0) {
					playHandle();
				}
				// 如果存在提示则移除
				var tips = document.getElementsByClassName('visualizer-player-tips');
				if (tips.length > 0) {
					myself.player.removeChild(tips[0]);
				}
			}).catch(function(e) {
				console.error(e);
				// 处理浏览器不支持自动播放情况
				var tips = document.createElement("div");
				tips.className = 'visualizer-player-tips';
				tips.innerHTML = '浏览器不支持自动播放,点我开始播放';
				tips.onclick = function() {
					myself.player.removeChild(tips);
					play();
				};
				myself.player.appendChild(tips);
				return false;
			})
		} else {
			myself.audio.pause();
			// 字符图标变化
			if (playBtn) {
				playBtn.setAttribute("data", "pause");
				playBtn.title = "播放";
				playBtn.innerHTML = "&#xea1c;";
			}
			window.clearInterval(timer);
		}
		// 事件传出
		myself.event({
			eventType: "play",
			describe: "播放/暂停",
			playing: !myself.audio.paused
		});
	}

	// 播放媒体信息更新
	function updates() {
		var list = myself.playList || [];
		var nowPlay = myself.nowPlay;
		if (!list[nowPlay]) return;
		var songTitle = document.getElementById("songTitle");
		songTitle.innerHTML = list[nowPlay].title || '未知歌曲';
		songTitle.title = "歌曲:" + list[nowPlay].title;
		var songAlbum = document.getElementById("album");
		var albumTitle = list[nowPlay].album || '';
		songAlbum.innerHTML = "(" + (albumTitle) + ")";
		songAlbum.style.display = albumTitle ? 'block' : 'none';
		songAlbum.title = "所属专辑:" + albumTitle;
		var songArtist = document.getElementById("artist");
		var artistName = list[nowPlay].artist || '';
		myself.division.style.display = artistName ? 'block' : 'none';
		songArtist.innerHTML = artistName;
		songArtist.title = "艺术家:" + artistName;
		// 数据
		resetDataList();
	}

	// 音频播放状态,做消息处理
	function playerState() {
		// 音频当前的就绪状态, 0 未连接 1 打开连接 2 发送请求 3 交互 4 完成交互,接手响应
		var state = myself.audio.readyState;
		var playerState = document.getElementById("player-state");
		var songInfo = myself.songInfo;
		if (state == 4) {
			if (playerState != null) {
				songInfo.removeChild(playerState);
				// 清除超时计时
				window.clearTimeout(overtime);
			}
		} else {
			if (playerState == null) {
				playerState = document.createElement("div");
				playerState.className = "player-state";
				playerState.id = "player-state";
				playerState.innerHTML = "<i class='icon-music'>&#xe911;</i>加载中……";
				songInfo.appendChild(playerState);
				// 加载超时处理
				overtime = setTimeout(function() { // 2分钟后超时处理
					if (myself.audio.readyState == 0) {
						playerState.innerHTML = "加载失败!"
					}
				}, 120000)
			}
		}
	}

	// 显示时长,进度
	function showTime() {
		if (myself.audio.readyState == 4) {
			// 时长总量
			var duration = myself.audio.duration;
			// 时长进度
			var currentTime = myself.audio.currentTime;
			// 剩余量
			// var surplusTime = duration - currentTime;
			var ratio = ((currentTime / duration) * 100).toFixed(1);
			// 将100.00%变为100%
			ratio = ratio == 100.0 ? 100 : ratio;

			function timeFormat(t) {
				return Math.floor(t / 60) + ":" + (t % 60 / 100).toFixed(2).slice(-2);
			}

			myself.playerTime.innerHTML = timeFormat(currentTime) + "&nbsp;/&nbsp;" + timeFormat(duration) + "&nbsp;&nbsp;&nbsp;&nbsp;" + ratio + "%";
			myself.playerProgressBar.style.width = ratio + "%";
			if (ratio == 100) { // 播放结束就播放就调用下一首
				next();
			}
		} else { // 状态不为4说明未就绪显示00:00
			myself.playerTime.innerHTML = "00:00&nbsp;/&nbsp;00:00&nbsp;&nbsp;&nbsp;&nbsp;0%";
		}
	}

	// 播放上一首
	function prev() {
		// 数组播放最前移动到最后
		if (myself.nowPlay == 0)
			myself.nowPlay = myself.playList.length;
		// 记录当前播放在数组里的位置位置移动,减小
		myself.nowPlay = myself.nowPlay - 1;
		// 先清除计时避免越点计时越快
		window.clearInterval(timer);
		// 重绘,变换效果
		if (myself.analyser != null) {
			drawSpectrum(myself.analyser);
		}
		// 事件传出
		myself.event({
			eventType: "prev",
			describe: "播放上一首"
		});
		myself.executePlay(myself.nowPlay, true);
	}

	function playByRow(row) {
		// 记录当前播放在数组里的位置位置移动
		myself.nowPlay = row;
		// 先清除计时避免越点计时越快
		window.clearInterval(timer);
		// 重绘,变换效果
		if (myself.analyser != null) {
			drawSpectrum(myself.analyser);
		}
		// 事件传出
		myself.event({
			eventType: "assign",
			describe: "播放指定歌曲"
		});
		myself.executePlay(myself.nowPlay, true);
	}

	this.playByRow = playByRow;

	// 播放下一首
	function next() {
		getNextNowPlayByLoopMode();
		// 先清除计时避免越点计时越快
		window.clearInterval(timer);
		// 重绘,变换效果
		if (myself.analyser != null) {
			drawSpectrum(myself.analyser);
		}
		// 事件传出
		myself.event({
			eventType: "next",
			describe: "播放下一首"
		});
		myself.executePlay(myself.nowPlay, true);
	}
	
	// 根据播放模式，获取下一首下标：
	function getNextNowPlayByLoopMode(){
		var nowRow = myself.nowPlay;
		if(myself.loopMode==2) // 单曲循环
			return nowRow;
		if(myself.loopMode==3){ // 随机播放
			if(myself.playList.length<2)
				return myself.nowPlay;// 只有一个，没办法随机播放
			do{
				nowRow = getRandomInt(0, myself.playList.length-1);
			}while (myself.nowPlay==nowRow);
			console.log('[随机播放]', nowRow);
			// 排除当前的，达到不循环
			return myself.nowPlay = nowRow;
		}
		// 数组播放最后移动到最前
		if (nowRow == myself.playList.length - 1){
			// 顺序播放 - 播放完了，停止
			if(myself.loopMode==1)
				myself.audio.pause();
			nowRow = -1;
		}
		// 记录当前播放在数组里的位置位置移动,增加
		return myself.nowPlay = nowRow + 1;
	}
	
	function getRandomInt(min, max){
		return Math.floor(Math.random()*(max-min+1)+min);
	}

	// 音量点击控制,静音-恢复
	function volume() {
		if (myself.button.volume) { // 判断是否设置音量按钮
			var volumeBtn = document.getElementById("playVolume");
			var data = volumeBtn.getAttribute("data");
			// 字符图标变化
			if (data == "normal") {
				volumeBtn.setAttribute("data", "mute");
				volumeBtn.innerHTML = "&#xea27;";
			} else {
				volumeBtn.setAttribute("data", "normal");
				volumeBtn.innerHTML = "&#xea2a;"
			}
		}
		// 点击音量控制
		if (myself.audio.muted) {
			myself.audio.muted = false;
		} else {
			myself.audio.muted = true;
		}
	}

	// 音量控制条点击设置音量大小
	function volumeChange(e, volumeBar, volumeSize) {
		// 点击的位置
		var offsetX = e.offsetX;
		// 获取音量条总高度
		var width = volumeBar.offsetWidth;
		// 算出占比
		var proportion = offsetX / width;
		proportion = Math.max(proportion, 0.01);
		volumeSize.style.width = (proportion * 100) + "%";
		var size = proportion;
		// 音量设置
		myself.audio.volume = size;
		// 音量cookie存储
		volumeSetCookie(size);
	}

	// 音量cookie设置
	function volumeSetCookie(size) {
		var d = new Date();
		d.setHours(d.getHours() + (24 * 30)); // 保存一个月
		document.cookie = "playerVolume=" + size + ";expires=" + d.toGMTString();
	}

	// 音量cookie获取
	function volumeGetCookie() {
		var volumeSize = document.getElementById("volumeSize");
		var arr, reg = new RegExp("(^| )playerVolume=([^;]*)(;|$)");
		var volume = 1;
		if (arr = document.cookie.match(reg)) {
			volume = unescape(arr[2]);
		} else {
			volume = 0.5;
		}
		volumeSize.style.width = volume * 100 + "%";
		return volume;
	}

	// 进度点击控制
	function progressControl(e, progress) {
		// 点击的位置
		var offsetX = e.offsetX;
		// 获取进度条总长度
		var width = progress.offsetWidth;
		// 算出占比
		var proportion = offsetX / width;
		// 把宽的比例换为播放比例,再计算audio播放位置
		var duration = myself.audio.duration;
		var playTime = duration * proportion;
		// 从此处播放
		myself.audio.currentTime = playTime;
	}

	// 播放处理,提取数据
	function playHandle() {
		// IE浏览器不绘制频谱
		if (!!window.ActiveXObject || "ActiveXObject" in window) {
			return false;
		}
		windowAudioContext();
		var audioContext = myself.audioContext;
		var analyser = audioContext.createAnalyser();
		var playData = audioContext.createMediaElementSource(myself.audio);
		// 将播放数据与分析器连接
		playData.connect(analyser);
		analyser.connect(audioContext.destination);
		// 接下来把分析器传出去创建频谱
		drawSpectrum(analyser);
		// 记录一下,还会用到analyser
		myself.analyser = analyser;
		myself.handle = 1;
	}

	// 频谱效果处理
	function drawSpectrum(analyser) {
		// 颜色数组
		var colorArray = ['#f82466', '#00FFFF', '#AFFF7C', '#FFAA6A', '#6AD5FF', '#D26AFF', '#FF6AE6', '#FF6AB8', '#FF6A6A', "#7091FF"];
		// 颜色随机数
		var colorRandom = Math.floor(Math.random() * colorArray.length);
		// 未设置将随机选取颜色
		myself.colour = myself.color || colorArray[colorRandom];
		// 图形数组
		var effectArray = [1, 2, 3];
		// 效果随机数
		var effectRandom = Math.floor(Math.random() * effectArray.length);
		var effect = myself.effect || effectArray[effectRandom];
		// 随机选取效果
		switch (effect) {
			case 1:
				// 条形
				bar(analyser);
				break;
			case 2:
				// 环形声波
				circular(analyser);
				break;
			case 3:
				// 心电图效果
				line(analyser);
				break;
			default:
				// 条形
				bar(analyser);
		}

	}

	// 16进制颜色转为RGB格式,传入16进制颜色代码与透明度
	function colorRgb(color, opacity) {
		var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/; // 十六进制颜色值的正则表达式
		opacity = opacity < 0 ? 0 : opacity; // 颜色范围控制
		opacity = opacity > 1 ? 1 : opacity;
		if (color && reg.test(color)) {
			if (color.length === 4) {
				var sColorNew = "#";
				for (var i = 1; i < 4; i += 1) {
					sColorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1));
				}
				color = sColorNew;
			}
			// 处理六位的颜色值
			var sColorChange = [];
			for (var i = 1; i < 7; i += 2) {
				sColorChange.push(parseInt("0x" + color.slice(i, i + 2)));
			}
			return "rgba(" + sColorChange.join(",") + "," + opacity + ")";
		} else {
			return color;
		}
	}

	// 条状效果
	function bar(analyser) {
		var canvas = myself.canvas,
			cwidth = canvas.width,
			cheight = canvas.height - 2,
			meterWidth = 10, // 频谱条宽度
			capHeight = 2,
			capStyle = '#FFFFFF',
			meterNum = 800 / (10 + 2), // 频谱条数量
			ctx = canvas.getContext('2d'),
			capYPositionArray = [], // 将上一画面各帽头的位置保存到这个数组
			gradient = ctx.createLinearGradient(0, 0, 0, 300);
		gradient.addColorStop(1, myself.colour);
		var drawMeter = function() {
			var array = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(array);
			var step = Math.round(array.length / meterNum); // 计算采样步长
			ctx.clearRect(0, 0, cwidth, cheight);
			for (var i = 0; i < meterNum; i++) {
				var value = array[i * step]; // 获取当前能量值
				if (capYPositionArray.length < Math.round(meterNum)) {
					capYPositionArray.push(value); // 初始化保存帽头位置的数组，将第一个画面的数据压入其中
				}
				ctx.fillStyle = capStyle;
				// 开始绘制帽头
				if (value < capYPositionArray[i]) { // 如果当前值小于之前值
					ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight); // 则使用前一次保存的值来绘制帽头
				} else {
					ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight); // 否则使用当前值直接绘制
					capYPositionArray[i] = value;
				}
				// 开始绘制频谱条
				ctx.fillStyle = gradient;
				ctx.fillRect(i * 12, cheight - value + capHeight, meterWidth, cheight);
				// 把能量传出
				myself.energy(value);
			}
			requestAnimationFrame(drawMeter);
		}
		requestAnimationFrame(drawMeter);
	}

	// 环形声波
	function circular(analyser) {
		var canvas = myself.canvas,
			width = canvas.width,
			height = canvas.height,
			ctx = canvas.getContext('2d');
		var drawCircular = function() {
			var array = new Uint8Array(128); // 长度为128无符号数组用于保存getByteFrequencyData返回的频域数据
			analyser.getByteFrequencyData(array); // 以下是根据频率数据画图
			ctx.clearRect(0, 0, width, height); // 清除画布
			for (var i = 0; i < (array.length); i++) {
				var value = array[i];
				ctx.beginPath();
				ctx.arc(width / 2, height / 2, value * 0.8, 0, 400, false);
				ctx.lineWidth = 2; // 线圈粗细
				ctx.strokeStyle = (1, colorRgb(myself.colour, value / 1000)); // 颜色透明度随值变化
				ctx.stroke(); // 画空心圆
				ctx.closePath();
				// 把能量传出
				myself.energy(value);
			}
			requestAnimationFrame(drawCircular);
		};
		requestAnimationFrame(drawCircular);
	}

	// 心电图效果
	function line(analyser) {
		var canvas = myself.canvas,
			width = canvas.width,
			height = canvas.height,
			ctx = canvas.getContext('2d');
		var drawLine = function() {
			var array = new Uint8Array(128); // 长度为128无符号数组用于保存getByteFrequencyData返回的频域数据
			analyser.getByteFrequencyData(array); // 以下是根据频率数据画图
			ctx.clearRect(0, 0, width, height); // 清除画布
			ctx.strokeStyle = myself.colour;
			ctx.lineWidth = 2; // 线粗细
			ctx.beginPath();
			for (var i = 0; i < (array.length); i++) {
				var value = array[i];
				// 绘制线根据能量值变化
				ctx.lineTo(i * 9, value + 150);
				// 把能量传出
				myself.energy(value);
			}
			ctx.stroke();
			ctx.closePath();
			requestAnimationFrame(drawLine);
		};
		requestAnimationFrame(drawLine);
	}
}