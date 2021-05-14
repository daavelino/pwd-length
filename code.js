/* 
  The result of a comparison between the entropy of a password and 
  the entropy of the search space equivalent to it. 
  It is always a number between 0 and 1, the greater the stronger.
 
  Please check

  https://en.wikipedia.org/wiki/Password_strength#Entropy_as_a_measure_of_password_strength 

  for a conceptual overview.
  */

const min_password_length = 12;
const default_alphabet = {
  1:{"name":"Arabic numerals (0–9)","count":10},
  2:{"name":"hexadecimal numerals (0–9, A–F)","count":16},
  3:{"name":"Case insensitive Latin alphabet (a–z or A–Z)","count":26},
  4:{"name":"Case insensitive alphanumeric (a–z or A–Z, 0–9)","count":36},
  5:{"name":"Case sensitive Latin alphabet (a–z, A–Z)","count":52},
  6:{"name":"Case sensitive alphanumeric (a–z, A–Z, 0–9)","count":62},
  7:{"name":"All ASCII printable characters except space","count":94},
  8:{"name":"All ASCII printable characters","count":95},
  9:{"name":"All extended ASCII printable characters","count":218},
  10:{"name":"Binary (0–255 or 8 bits or 1 byte)","count":256},
  11:{"name":"Diceware word list","count":7776}
};

const security_range = {
  "excellent":[80,100],
  "strong":[60,80],
  "good":[40,60],
  "fair":[20,40],
  "weak":[0,20]
}

// HTML presets:
document.getElementById("password_label").innerHTML="Password <small>("
  +min_password_length+" characters minimum)</small>:";
document.getElementById("password").focus();

function format_number(number, digits) {
  // Format numbers for better visualization:
  return number.toLocaleString(undefined,{minimumFractionDigits:digits});
}

function factorial(n) {
  // Mathematical factorial of the number n:
  if (typeof n !== 'number') {
    return 1;
  }
  if (n === 0) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}

function num_combination(n, k) {
  // Credits: https://medium.com/geekculture/generating-all-possible-combinations-of-string-characters-in-javascript-8e5a5ea2b9bd
  // The number of permutations of k objects from a set of n elements:
  return factorial(n + k - 1) / factorial(k);
}


/*
 * Generate all possible combinations from a list of characters for a given length
 */
function* charCombinations (chars, minLength, maxLength) {
  chars = typeof chars === 'string' ? chars : '';
  minLength = parseInt(minLength) || 0;
  maxLength = Math.max(parseInt(maxLength) || 0, minLength);

  //Generate for each word length
  for (i = minLength; i <= maxLength; i++) {

    //Generate the first word for the password length by the repetition of first character.
    word = (chars[0] || '').repeat(i);
    yield word;

    //Generate other possible combinations for the word
    //Total combinations will be chars.length raised to power of word.length
    //Make iteration for all possible combinations
    for (j = 1; j < Math.pow(chars.length, i); j++) {

      //Make iteration for all indices of the word
      for(k = 0; k < i; k++) {

        //check if the current index char need to be flipped to the next char.
        if(!(j % Math.pow(chars.length, k))) {

          // Flip the current index char to the next.
          let charIndex = chars.indexOf(word[k]) + 1;
          char = chars[charIndex < chars.length ? charIndex : 0];
          word = word.substr(0, k) + char + word.substr(k + char.length);
        }
      }

      //Re-oder not neccesary but it makes the words are yeilded alphabetically on ascending order.
      yield word.split('').reverse().join('');
    }
  }
}



function clear_data() {
  document.getElementById("password").value = "";
  document.getElementById("security-label").innerHTML = "";
  document.getElementById("parameters").innerHTML = "";
  document.getElementById("password").focus();
}

function getUnique(word) {
  // Returns a list with the unique characters in a given word.
  let unique_values = [];
  let length = word.length;
  for (let i=0; i<length; i++) {
    if (! unique_values.includes(word[i])) {
      unique_values.push(word[i]);
    } 
  }

  return unique_values; 
}

function word_entropy(word, alphabet_length) {
  // H = L (log N / log 2), where L is the number of symbols in the word 
  // and N is the number of possible symbols in the alphabet 
  // (or the alphabet size).
  // Returns the entropy value in bits or zero, for a word with length 0:
  if (word.length == 0) {
    return 0;
  } else {
    L = getUnique(word);
    L = L.length;
    return L * (Math.log(alphabet_length) / Math.log(2));
  }
}

function evaluate(metric) {
  // Evaluates the password metric in terms of the security range:
  if (! metric) {
    return "";
  }
  const range_keys = Object.keys(security_range);
  for (let i=0;i<range_keys.length;i++) {
    let actual_key = range_keys[i];
    let min = security_range[actual_key][0] / 100;
    let max = security_range[actual_key][1] / 100;
    if (metric >= min && metric <= max) {
      return(actual_key);
    }
  }
}

function breakit() {
    let max_attempts = 10000000;
    let password = document.getElementById("password").value;
    let password_length = password.length;
    let password_alphabet = getUnique(password);
    let seed = password_alphabet.join("");

    let passwords = charCombinations(seed, password_length, password_length);
    let counter = 0;
    let tmp;
    while(tmp = passwords.next()) {
      if (counter > max_attempts) {
	document.getElementById("break_result").innerHTML = "Max. attempts limit reached: "+format_number(max_attempts)+". Not broken.";
        break;
      }
      if (tmp.value === password) {
        console.log("Attempts until find: "+counter)
	document.getElementById("break_result").innerHTML = "Attempts until find it: "+format_number(counter);
        break;
      }
      counter = counter + 1;
  }
  return(counter);
}

function pwdStrength() {
  // Calculates the strenghness of the password:

  const alphabet_choice = 8; //All ASCII printable characters. 
  let symbol_count = default_alphabet[alphabet_choice]["count"]; 
  let entropy_per_symbol = Math.log(symbol_count) / Math.log(2);
  let password = "";
  let password_alphabet = [];
  let seed = "";
  let password_length = 0;
  let password_entropy = 0;
  let search_space_entropy = 0;
  let evaluation = "";

  // Get the value at input each time user type a new character.
  password = document.getElementById("password").value;
  password_length = password.length;

  // The entropy of a same-size random word on the chosen alphabet space 
  // (in bits):
  search_space_entropy = entropy_per_symbol * password_length;

  // The entropy consider the unique symbols in the word as its alphabet space 
  // (in bits):
  password_entropy = word_entropy(password, symbol_count);

  metric = (password_entropy / search_space_entropy);
  evaluation = evaluate(metric);

  password_alphabet = getUnique(password);
  password_alphabet_length = password_alphabet.length;
  seed = password_alphabet.join("");

  // Format HTML results:
  document.getElementById("security-label").innerHTML = evaluation;
  let html_text = document.getElementById("parameters").innerHTML = 
    "Evaluation: "+evaluation 
    + "<br>"
    + "Min. password length: "+min_password_length 
    + "<br>" 
    + "Min. password entropy: "+format_number((min_password_length * entropy_per_symbol), 3)+" bits" 
    + "<br>" 
    + "Password length: "+password_length 
    + "<br>" 
    + "Password entropy: "+format_number(password_entropy, 3)+" bits" 
    + "<br>" 
    + "Password alphabet size: "+password_alphabet_length
    + "<br>" 
    + "Password alphabet: "+getUnique(password) 
    + "<br>" 
    + "Max. # of attempts to sweeps: "+format_number(num_combination(password_length, password_alphabet_length), 0)
    + "<br>"
    + "<br>"
    + "<button id='clear_button' onclick='breakit()'>Simulate breaking it?</button>"
    + "<br>"
    + "<br>"
    +"<span id='break_result'></span>";

}


