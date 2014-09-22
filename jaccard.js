module.exports = function(sen1List, sen2List) {
	var countOverlap = 0;

	for (var i = 0; i < sen1List.length; i++) {
		for (var j = 0; j < sen2List.length; j++) {
			if (sen1List[i] == sen2List[j]) {
				countOverlap++;
			}
		}
	}

	var countSum = sen1List.length + sen2List.length;

	return countOverlap / (countSum - countOverlap);
}