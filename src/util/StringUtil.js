//
// StringUtil.js , helper method for Javascript String , -v 1.0.0 credit to monjer
//
(function(opt_ns , opt_win){
			
	//---------------- Helper function --------------
	function forEach(array,fn,ctx){
		if(array == null){
			return ;
		}
		if(array.forEach){
			array.forEach(fn,ctx);
		}else{
			
			for(var i = 0 ; i < array.length ; i++){
				fn.call(ctx , array[i] , i , array) ;								
			}
		}
	}
	
	function map(array , fn , ctx){
		var results = [] ;
		
		array = array||[];
		
		if(array.map){
			return array.map(fn,ctx);
		}else{
			var val = null ;
			forEach(array , function(value , index , array){
				val = fn.call(ctx , value , index , array);
				results.push(val);
			});
			return results;
		}
	}
	
	function isArray(obj){
		return Object.prototype.toString.call(obj) == "[object Array]";
	}
	
	function isString(str){
		return typeof str == "string" ;	
	}
					
	var StringUtil = {
			
			/**
			 * 清除字符串左右两侧的空白字符
			 * @return {String} 新的字符串
			 * @param str {String}
			 **/
			trim:function(str){
				
				if(isString(str)){
					return str.trim ? str.trim() : str.replace(/^\s*|\s*$/g,"");
				} 
				
				return str ;
			},
			/**
			 * 清除字符串左侧的空白字符
			 * @return {String} 新的字符串
			 * @param str {String}
			 **/
			trimLeft:function(str){
				if(isString(str)){
					return str.trimLeft ? str.trimLeft() : str.replace(/^\s*/g,"");
				} 
				return str ;
			},
			/**
			 * 清除字符串右侧的空白字符
			 * @return {String} 新的字符串
			 * @param str {String}
			 **/
			trimRight:function(str){
				if(isString(str)){
					return str.trimRight ? str.trimRight() : str.replace(/\s*$/g,"");
				} 
				return str ;
			},
			/**
			 * 清除字符串数组中所有字符串左右两侧的空白字符
			 * @return {String} 新的字符串
			 * @param str {String}
			 **/
			trimAll:function(strArr){
				if(isArray(strArr)){
					return map(strArr , this.trim , this);
				}
				return strArr ;
			},
			/**
			 * 清除字符串数组中所有字符串左侧的空白字符
			 * @return {String} 新的字符串
			 * @param str {String}
			 **/
			trimLeftAll:function(strArr){
				if(isArray(strArr)){
					return map(strArr , this.trimLeft , this);
				}
				return strArr ;
			},
						
			/**
			 * 清除字符串数组中所有字符串右侧的空白字符
			 * @return {String} 新的字符串
			 * @param str {String}
			 **/
			trimRightAll:function(strArr){
				if(isArray(strArr)){
					return map(strArr , this.trimRight , this);
				}
				return strArr ;
			},
			
			/**
			 * 判断字符串是否是空字符串
			 * @return {Boolean}
			 * @param str {String}
			 **/
			isEmpty:function(str){
				return !str || /^\s*$/.test(str);
			},
			
			/**
			 * 将字符串分割成字符串数组
			 * @return {Array} 
			 * @param str {String} 具有间隔符的字符串
			 * @param opt_separator {Option|String} str中的分隔符，默认为连续的空白字符串
			 **/			
			toArray:function(str , opt_separator){
				if(!str){
					
					return [];
					
				}else if(isString(str)){
					
					return [str];
					
				}else{

					opt_separator = opt_separator || /\s+/ ;

					return str.split(opt_separator);
				}
			},
			
			/**
			 * 将字符串分割成字符数组
			 * @return {Array} 
			 * @param str {String} 
			 */
			toCharArray:function(str){
				if(isString(str)){
					return str.split("");
				}
				return [];
			},
			
			/**
			 * 将字符串转换成小写字符串
			 * @return {String} 
			 * @param str {String} 
			 */
			toLow:function(str){
				
				if(isString(str)){
					return str.toLowerCase();
				}
				return str ;
			},
			
			/**
			 * 将字符串转换成大写字符串
			 * @return {String} 
			 * @param str {String} 
			 */
			toUp:function(str){
				if(isString(str)){
					return str.toUpperCase();
				}
				return str ;
			},
			
			/**
			 * 判断一个字符串是否包含另一字符串
			 * @return {Boolean} 
			 * @param str {String}  源字符串
			 * @param search {String} 被包含的字符串
			 */
			contains:function(str , search){
				if(isString(str) && isString(search)){
					return str.indexOf(search) != -1;
				}
				return false ;
			},
			
			/**
			 * 判断一个字符串是否是以另一字符串开头
			 * @return {Boolean} 
			 * @param str {String}  源字符串
			 * @param search {String} 被包含的字符串
			 */
			startWith:function(str , search){
				if(isString(str) && isString(search)){
					return str.indexOf(search) == 0;
				}
				return false ;
			},
			
			/**
			 * 判断一个字符串是否是以另一字符串结尾
			 * @return {Boolean} 
			 * @param str {String}  源字符串
			 * @param search {String} 被包含的字符串
			 */
			endWith:function(str , search){
				
				if(isString(str) && isString(search)){
					var index = str.lastIndexOf(search) ;
					return index != -1 && (str.length - search.length) == index ;
				}
				return false ;
			},
			
			/**
			 * 将字符串str中包含的第一个fromStr替换成为toStr,从字符串起始搜索
			 * @return {Boolean} 
			 * @param str {String}  源字符串
			 * @param fromStr {String} 被替换的字符串
			 * @param toStr {String} 新的替换后的字符串
			 */
			replaceFirst:function(str , fromStr , toStr){
				if(isString(str) && isString(fromStr) && isString(toStr)){
					return str.replace(fromStr , toStr);
				}
				return str;
			},
			
			/**
			 * 将字符串str中包含的所有fromStr替换成为toStr,从字符串起始搜索
			 * @return {Boolean} 
			 * @param str {String}  源字符串
			 * @param fromStr {String} 被替换的字符串
			 * @param toStr {String} 新的替换后的字符串
			 */
			replaceAll:function(str , fromStr , toStr){
				if(isString(str) && isString(fromStr) && isString(toStr)){
					var regexp = new RegExp(fromStr , "g");
					return str.replace(regexp , toStr);
				}
				return str;
			},
			
			/**
			 * 将字符串str中包含的从末尾开始出现的第一个fromStr替换成为toStr
			 * @return {Boolean} 
			 * @param str {String}  源字符串
			 * @param fromStr {String} 被替换的字符串
			 * @param toStr {String} 新的替换后的字符串
			 */
			replaceLast:function(str , fromStr , toStr){
				if(isString(str) && isString(fromStr) && isString(toStr)){
					var regExp = new RegExp(fromStr+"$" , "g");
					return str.replace(regExp,toStr);
				}
				return str;
			}
			
	};		
	
	opt_win = opt_win || top ;
	opt_ns = opt_ns || opt_win;
	opt_ns.StringUtil = StringUtil ;
	
})();
