+(function($) {
    var pluginName = 'uploader';

    // These are the plugin defaults values
    var defaults = {
        url : document.URL,
        method : 'POST',
        extraData : {},
        /**
		 * 文件大小验证
		 * @property allowedTypes
		 */
        maxFileSize : 0,
        /**
		 * 文件类型验证
		 * @property allowedTypes
		 */
        allowedTypes : '*',
        /**
		 * 文件名称验证
		 * @property extFilter
		 */
        extFilter : null,
        dataType : null,
        fileName : 'file',
        /**
		 * 组件初始化触发
		 */
        onInit : function() {
        },
        onFallbackMode : function() {

        },
        /**
		 * 文件开始上传事件
		 * @property id
		 * @property file
		 */
        onNewFile : function(id, file) {

        },
        /**
		 * 文件上传之前
		 * @property id
		 */
        onBeforeUpload : function(id) {

        },
        /**
		 * 完成事件
		 */
        onComplete : function() {

        },
        /**
		 * 文件开始上传事件
		 * @property id
		 * @property percent  百分比数值
		 */
        onUploadProgress : function(id, percent) {

        },
        /**
		 * 文件上传完成
		 */
        onUploadSuccess : function(id, data) {

        },
        /**
		 * 文件上传出错
		 * @property id
		 * @property message
		 */
        onUploadError : function(id, message) {

        },
        /**
		 * 文件类型不匹配
		 * @property file
		 */
        onFileTypeError : function(file) {

        },
        /**
		 * 文件大小不匹配
		 * @property file
		 */
        onFileSizeError : function(file) {

        },
        /**
		 * 文件名称不匹配
		 * @property file
		 */
        onFileExtError : function(file) {

        }
    };

    var Uploader = function(element, options) {
        this.element = $(element);

        this.settings = $.extend({}, defaults, options);
        if (!this.checkBrowser()) {
            this.swfUploader();
            return false;
        }

        this.init();

        return true;
    };

    Uploader.prototype.checkBrowser = function() {
        if (window.FormData === undefined) {
            this.settings.onFallbackMode.call(this.element, 'Browser doesn\'t support From API');
            this.element.find('.error-msg').text('Browser doesn\'t support From API');
            return false;
        }

        if (this.element.find('input[type=file]').length > 0) {
            return true;
        }

        if (!this.checkEvent('drop', this.element) || !this.checkEvent('dragstart', this.element)) {
            this.settings.onFallbackMode.call(this.element, 'Browser doesn\'t support Ajax Drag and Drop');
            this.element.find('.error-msg').text('Browser doesn\'t support Ajax Drag and Drop');
            return false;
        }

        return true;
    };

    Uploader.prototype.checkEvent = function(eventName, element) {
        var element = element || document.createElement('div');
        var eventName = 'on' + eventName;

        var isSupported = eventName in element;

        if (!isSupported) {
            if (!element.setAttribute) {
                element = document.createElement('div');
            }
            if (element.setAttribute && element.removeAttribute) {
                element.setAttribute(eventName, '');
                isSupported = typeof element[eventName] == 'function';

                if ( typeof element[eventName] != 'undefined') {
                    element[eventName] = undefined;
                }
                element.removeAttribute(eventName);
            }
        }

        element = null;
        return isSupported;
    };

    Uploader.prototype.init = function() {
        var widget = this;
        widget.element.html(Uploader.TEMPLATE1.join(''));
        widget.queue = new Array();
        widget.queuePos = -1;
        widget.queueRunning = false;

        // -- Drag and drop event
        widget.element.on('drop', function(evt) {
            evt.preventDefault();
            var files = evt.originalEvent.dataTransfer.files;

            widget.queueFiles(files);
        });

        var inputFile = widget.element.find('input[type=file]');
        //-- Optional File input to make a clickable area
        inputFile.on('change', function(evt) {
            var files = evt.target.files;

            widget.queueFiles(files);

            $(this).val('');
        });
        widget.element.find('.dropfile').on('click', function(e){
            e.stopPropagation();
            e.preventDefault();
            inputFile.click();
        });
        widget.element.find('#uploadBtn').on('click', function(e){
            e.stopPropagation();
            e.preventDefault();
            inputFile.click();
        });
        this.settings.onInit.call(this.element);
    };

    Uploader.prototype.queueFiles = function(files) {
        var j = this.queue.length;

        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            // Check file size
            if ((this.settings.maxFileSize > 0) && (file.size > this.settings.maxFileSize)) {
                this.element.find('.error-msg').css('color', '#d2322d').text('File Size Error!');
                this.settings.onFileSizeError.call(this.element, file);

                continue;
            }
            // Check file type
            if ((this.settings.allowedTypes != '*') && !file.type.match(this.settings.allowedTypes)) {
                this.element.find('.error-msg').css('color', '#d2322d').text('File Type Error!');
                this.settings.onFileTypeError.call(this.element, file);

                continue;
            }

            // Check file extension
            if (this.settings.extFilter != null) {
                var extList = this.settings.extFilter.toLowerCase().split(';');

                var ext = file.name.toLowerCase().split('.').pop();

                if ($.inArray(ext, extList) < 0) {
                    this.element.find('.error-msg').css('color', '#d2322d').text('File Ext Error!');
                    this.settings.onFileExtError.call(this.element, file);
                    continue;
                }
            }

            this.queue.push(file);

            var index = this.queue.length - 1;
            this.element.find('.file-name').text(file.name);
            this.element.find('.file-name').removeAttr('data-title')
            this.settings.onNewFile.call(this.element, index, file);
        }

        // Only start Queue if we haven't!
        if (this.queueRunning) {
            return false;
        }

        // and only if new Failes were succefully added
        if (this.queue.length == j) {
            return false;
        }

        this.processQueue();

        return true;
    };

    Uploader.prototype.processQueue = function() {
        var widget = this;

        widget.queuePos++;

        if (widget.queuePos >= widget.queue.length) {
            // Cleanup

            widget.settings.onComplete.call(widget.element);

            // Wait until new files are droped
            widget.queuePos = (widget.queue.length - 1);

            widget.queueRunning = false;

            return;
        }

        var file = widget.queue[widget.queuePos];

        // Form Data
        var fd = new FormData();
        fd.append(widget.settings.fileName, file);

        // Append extra Form Data
        $.each(widget.settings.extraData, function(exKey, exVal) {
            fd.append(exKey, exVal);
        });
        widget.element.find('.file-info').show();
        widget.settings.onBeforeUpload.call(widget.element, widget.queuePos);

        widget.queueRunning = true;

        // Ajax Submit
        $.ajax({
            url : widget.settings.url,
            type : widget.settings.method,
            dataType : widget.settings.dataType,
            data : fd,
            cache : false,
            contentType : false,
            processData : false,
            forceSync : false,
            xhr : function() {
                var xhrobj = $.ajaxSettings.xhr();
                if (xhrobj.upload) {
                    xhrobj.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position;
                        var total = event.total || e.totalSize;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        widget.element.find('.progress-bar').css('width', percent + '%');
                        widget.settings.onUploadProgress.call(widget.element, widget.queuePos, percent);
                    }, false);
                }

                return xhrobj;
            },
            success : function(data, message, xhr) {
                widget.element.find('.progress-bar').css('width', '100%');
                widget.settings.onUploadSuccess.call(widget.element, widget.queuePos, data);
            },
            error : function(xhr, status, errMsg) {
                widget.element.find('.error-msg').css('color', '#d2322d').text(errMsg);
                widget.settings.onUploadError.call(widget.element, widget.queuePos, errMsg);
            },
            complete : function(xhr, textStatus) {
                widget.processQueue();
            }
        });
    }
    Uploader.prototype.swfUploader = function(){
        var widget = this;
        widget.element.html(Uploader.TEMPLATE2.join(''));
        var swfu = new SWFUpload({
            flash_url : widget.settings.flash_url,
            upload_url: widget.settings.url,
            file_size_limit : widget.settings.fileSizeLimit || '50 MB',
            file_types : "*.*",
            file_post_name : 'file',
            // Button settings
            button_width: '125',
            button_height: '34',
            button_placeholder_id: 'swfUpload',
            button_image_url: widget.settings.button_image_url,
            button_text: '<span class="sud_btn">选择文件 </span>',
            button_text_style: '.sud_btn {width: 125px; background-color:#f00; font-size: 18px; }',
            button_text_top_padding: 10,
            button_text_left_padding: 35,
            button_window_mode: SWFUpload.WINDOW_MODE.WINDOW,
            button_cursor: SWFUpload.CURSOR.HAND,
            upload_progress_handler : function(file, complate, total){
                var percentage = complate/total*100 + '%';
                widget.element.find('.progress-bar').css('width', percentage);
            },
            upload_start_handler: function(file){
                widget.element.find('.file-name').text(file.name);
            },
            upload_error_handler : function(file, errorCode, message){
                widget.element.find('.point-title').css('color', '#d2322d').text('errorCode:'+errorCode+',message:'+message);
            },
            upload_success_handler  : function(file, data, response){
                widget.element.find('.point-title').css('color', '#47a447').text('文件上传成功');
                widget.settings.onUploadSuccess.call(widget.element, file.name, data);
            }
        });
        widget.element.find('#startBtn').on('click', function(){
            swfu.startUpload();
            widget.element.find('.progress').show();
            widget.element.find('.point-title').text('文件开始上传');
        });
        widget.element.find('#cancleBtn').on('click', function(){
            swfu.cancelUpload();
            widget.element.find('.point-title').text('文件取消上传');
        });
    }
    Uploader.TEMPLATE1 = [
        '<div class="uploader">',
        '<input type="file" name="files[]" style="display:none;">',
        '<div class="file-input" id="uploadBtn">',
        '<label class="file-label" data-title="Choose">',
        '<span class="file-name" data-title="No File ...">',
        '<i class="fa fa-upload"></i></span></label>',
        '<a class="remove" href="#"><i class="icon-remove"></i></a></div>',
        '<div class="dropfile"><div>Drag &amp; Drop File Here</div>',
        '<div class="file-info"><div class="progress progress-striped active">',
        '<div class="progress-bar progress-bar-success" role="progressbar"></div>',
        '</div><div class="point-title"></div>',
        '<div class="file-name"></div><div class="error-msg"></div></div>',
        '<div class="browser">',
        '<span class="fa fa-cloud-upload"></span>',
        '</div></div></div>'
    ];
    Uploader.TEMPLATE2 = [
        '<div id="swfUploadContainer" class="swfUpload-Container">',
        '<div style="width:210px;"><div id="swfUpload"></div>',
        '<button type="button" class="btn btn-default" id="cancleBtn" style="margin-left:5px;"><i class="fa fa-stop" ></i></button>',
        '<button type="button" class="btn btn-default" id="startBtn" ><i class="fa fa-play" ></i></button>',
        '</div><div class="progress progress-striped active" style="display:none">',
        '<div class="progress-bar progress-bar-success" role="progressbar"aria-valuemax="100"></div>',
        '</div>',
        '<div class="point-title"></div>',
        '<div class="file-name"></div>',
        '<div class="error-msg"></div>',
        '</div>'
    ]
    $.fn.uploader = function(options) {
        return this.each(function() {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new Uploader(this, options));
            }
        });
    };

    // -- Disable Document D&D events to prevent opening the file on browser when we drop them
    $(document).on('dragenter', function(e) {
        e.stopPropagation();
        e.preventDefault();
    });
    $(document).on('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
    });
    $(document).on('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
    });
})(jQuery);
