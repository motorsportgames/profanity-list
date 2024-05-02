#!/usr/bin/env node

const fs = require('fs');

const languages = ['en', 'fr', 'es', 'de', 'emoji'];

const sortByName = (a, b) => {
  const lcA = a.toLocaleLowerCase();
  const lcB = b.toLocaleLowerCase();

  if (lcA < lcB) return -1;
  if (lcA > lcB) return 1;
  return 0;
};

console.log('Processing languages...');


const ApplyCharacterClassMatching = (regex) => {
  const letterToCharClass = {
    'a': "[aáàâãä4]",
    'e': "[eéèêë3]",
    'i': "[iíìîï1]",
    'o': "[oóòôõö0]",
    'u': "[uúùûü]",
    'n': "[nñ]",
  };

  const newRegex = [];
  for (let i = 0; i < regex.length; i++) {
    const char = regex[i];
    // Some regexes already have the class in it so skip those
    if (i > 0 && regex[i - 1] === '[') {
      newRegex.push(char);
      continue;
    }

    // If its a regular letter replace it with the character class
    if (letterToCharClass[char]) {
      newRegex.push(letterToCharClass[char]);
    } else {
      newRegex.push(char);
    }
  }

  return newRegex.join('');
}

languages.forEach((language) => {
  console.log(`  - Processing '${language}'...`);
  const data = require(`../src/${language}.json`);
  const metaWords = [];
  const plainWords = [];
  const tags = [];

  data.forEach((databaseOrDictionaryItem) => {
    const dictionary = Array.isArray(databaseOrDictionaryItem.dictionary) ? databaseOrDictionaryItem.dictionary : [databaseOrDictionaryItem];

    if (Array.isArray(databaseOrDictionaryItem.tags)) {
      databaseOrDictionaryItem.tags.forEach((tag) => {
        if (tags.includes(tag)) return;
        tags.push(tag);
      });
    }

    dictionary.forEach((item) => {
      if (typeof item === "string") {
        const wordId = item.replace(/[*|]/g, '');

        metaWords.push({
          id: wordId,
          match: item,
        });

        item.split('|').forEach((match) => {
          plainWords.push(match.replace(/[*]/g, ''));
        });

        return;
      }

      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          if (tags.includes(tag)) return;
          tags.push(tag);
        });
      }

      let itemTags = [];

      if (Array.isArray(databaseOrDictionaryItem.tags)) {
        itemTags = itemTags.concat(databaseOrDictionaryItem.tags);
      }

      if (Array.isArray(item.tags)) {
        itemTags = itemTags.concat(item.tags);
      }

      metaWords.push({
        id: item.id,
        match: ApplyCharacterClassMatching(item.match),
        tags: itemTags,
        severity: databaseOrDictionaryItem.severity || item.severity,
        exceptions: databaseOrDictionaryItem.exceptions || item.exceptions,
      });

      item.match.split('|').forEach((match) => {
        plainWords.push(match.replace(/[*]/g, ''));
      });
    });
  });

  metaWords.sort((a, b) => sortByName(a.id, b.id));
  plainWords.sort(sortByName);
  tags.sort(sortByName);

  fs.writeFileSync(`./${language}.json`, JSON.stringify(metaWords, undefined, 2));
  fs.writeFileSync(`./${language}.txt`, plainWords.join("\n"));

  console.log(`    Completed: ${metaWords.length} profanities`);
  console.log(`               ${plainWords.length} matches`);
  console.log(`         Tags: ${tags.join(', ')}`);
});

console.log('Done!');

/*func ApplyCharacterClassMatching(regex string) (string, error) {
	letterToCharClass := map[rune]string{
		'a': "[aáàâãä]",
		'e': "[eéèêë]",
		'i': "[iíìîï]",
		'o': "[oóòôõö]",
		'u': "[uúùûü]",
		'n': "[nñ]",
	}

	var newRegex strings.Builder
	for i, char := range regex {
		// Some regexes already have the class in it so skip those
		if i > 0 && regex[i-1] == '[' {
			newRegex.WriteRune(char)
			continue
		}

		// If its a regular letter replace it with the character class
		if replacement, ok := letterToCharClass[char]; ok {
			newRegex.WriteString(replacement)
		} else {
			newRegex.WriteRune(char)
		}
	}

	return newRegex.String(), nil
}*/