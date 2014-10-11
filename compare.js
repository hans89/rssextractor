var fs = require('fs');
var _ = require('underscore');

var args = process.argv.slice(2);

var file = fs.readFileSync(args[0], 'utf-8');
var lines = file.split('\n');

var cmp = args[1] == 'dice' ? require('./dice') : require('./jaccard');

var stopwords = ["bị", "bởi", "cả", "các", "cái", "cần", "càng", "chỉ", "chiếc", "cho", "chứ", "chưa", "chuyện", "có", "có_thể", "cứ", "của", "cùng", "cũng", "đã", "đang", "đây", "để", "đến_nỗi", "đều", "điều", "do", "đó", "được", "dưới", "gì", "khi", "không", "là", "lại", "lên", "lúc", "mà", "mỗi", "một_cách", "này", "nên", "nếu", "ngay", "nhiều", "như", "nhưng", "những", "nơi", "nữa", "phải", "qua", "ra", "rằng", "rằng", "rất", "rất", "rồi", "sau", "sẽ", "so", "sự", "tại", "theo", "thì", "trên", "trước", "từ", "từng", "và", "vẫn", "vào", "vậy", "vì", "việc", "với", "vừa", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "-", "=", "^", "~", "|", "[", "]", "{", "}", ",", ".", "<", ">", "/", "?", "_", "\\", ";", ":", "+", "*"];

var hashMap = {};
var count = 0;

var parse = function(line) {
	var pattern = /(\d+) ?; ?(.+)/;
	var result = line.match(pattern);
	if (result)
		return { 
			 id : result[1]
			, raw : result[2]
			, title : result[2].toLowerCase().split(' ')
		};
	return null;
}

var hashSentence = function(sentence, hashFunc) {
	sentence.hashArray = [];

	for (var i = 0; i < sentence.title.length; i++) {
		if (stopwords.indexOf(sentence.title[i]) == -1) {
			sentence.hashArray.push(hashFunc(sentence.title[i]));	
		}
	}

	sentence.uniqHashArray = _.uniq(sentence.hashArray);
	// console.log(sentence.id, sentence.hashArray, sentence.uniqHashArray);
}

var sentences = [];

for (var i = 0; i < lines.length; i++) {
	var sen = parse(lines[i]);
	if (sen) {
		for (var j = 0; j < sen.title.length; j++) {
			var word = sen.title[j];

			// mark words
			if (hashMap[word] == undefined && stopwords.indexOf(word) == -1) {
				hashMap[word] = count++;
			}
		}

		hashSentence(sen, function(word) {
			return hashMap[word];
		});

		var n = sentences.push(sen);

		// console.log(sentences[n-1]);	
	}
}


var max = sentences.length;
var threshold = 0;
for (var i = 0; i < max - 1; i++) {
	var sen1 = sentences[i];
	for (var j = i+1; j < max; j++) {
		var sen2 = sentences[j];
		var sim = cmp(sen1.uniqHashArray, sen2.uniqHashArray);

		//if (sim > threshold)
			console.log(sen1.id, sen2.id, sim);
	}	
}
	