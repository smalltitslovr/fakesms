function parseTime(timeString) {    
    if (timeString === '' || timeString === undefined) return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i); 
    if (time == null) return null;

    var hours = parseInt(time[1],10);    
    if (hours == 12 && !time[4]) {
          hours = 0;
    }
    else {
        hours += (hours < 12 && time[4])? 12 : 0;
    }   
    var d = new Date();             
    d.setHours(hours);
    d.setMinutes(parseInt(time[3],10) || 0);
    d.setSeconds(0, 0);  
    return d;
}

function dateToTimestampParts(date, day=true, time=true) {
  var relativeDateTimeString = $("#relative-date").val()
  var relativeDateTime;
  if (relativeDateTimeString == '') { 
      relativeDateTime = moment()
  } else {
      relativeDateTime = moment(relativeDateTimeString)
  }
  return {
    day: date.calendar(relativeDateTime, {
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: 'dddd',
      lastDay: '[Yesterday]',
      lastWeek: 'dddd',
      sameElse: 'DD/MM/YYYY'
    }),
    time: date.format("h:mm a")
  }
}

function smartTimestamp(msg, i, arr) {
  if (i === 0) {
    if (msg.dateTimeFormat === null || !msg.dateTime.isValid()) {
      // Invalid date, but it's the first message. Use now as the timestamp
      msg.dateTime = moment()
    }
    // We're processing the first message. Show the timestamp
    return Object.assign(msg, dateToTimestampParts(msg.dateTime))
  } else {
    const prevDateTime = arr[i-1].dateTime
    if (msg.dateTimeFormat === null) {
      // No dateTime, so we won't show the timestamp in the html. 
      // But we do want to set the date for the next message
      msg.dateTime = prevDateTime
      return msg
    } else {
    
      // No date. Set it to the previous one
      if (msg.dateTimeFormat == 'time') {
        msg.dateTime.set({'year': prevDateTime.year(), 'month': prevDateTime.month(), 'date': prevDateTime.date()})
      }

      if (prevDateTime.isSame(msg.dateTime, "day")) {
        const minsApart = (msg.dateTime - prevDateTime) / 60000;
        if (minsApart >= 5) {
          // It's been at least 5 minutes. Show the timestamp
          return Object.assign(msg, dateToTimestampParts(msg.dateTime))
        } else {
          // It's been less than 5 minutes. Don't show the timestamp
          return msg
        }

      } else {
        // We're on a new day. Show the timestamp
        return Object.assign(msg, dateToTimestampParts(msg.dateTime))
      }
    }
  }
}

function parseMessages(input, senderName) {
  const LINE_REGEX = /^(?:\[(.*)\]\s*)?(.+?):\s*(.*)$/
  const IMAGE_REGEX = /^{(.*)}$/
  const EMOJI_REGEX = /:(?:em-)?(.+?):/g
  
  const lines = input.split('\n')
  var recipientNames = []
  var recipientName
    
  var messages = lines.map(function(line, i) {
    const match = line.match(LINE_REGEX)
    if (match) {
      const body = match[3]
      
      const imageMatch = body.match(IMAGE_REGEX)
      var text;
      if (imageMatch) {
        const isImage = true
        text = `<img src="${imageMatch[1]}" />`
      } else {
        const isImage = false
        // Replace emojis with their html counterpart
        text = body.replace(EMOJI_REGEX, '<i class="em em-$1"></i>')
      }
      
      const name = match[2]
      const isSender = senderName == name
      const type = isSender ? 'sent' : 'received'
      
      // Add the name to the list of recipients, if it's missing
      if (name !== senderName && recipientNames.indexOf(name) === -1) { recipientNames.push(name); }
      
      // Parse the timestamp
      const rawTimestamp = match[1]
      let dateTime, dateTimeFormat
      if (rawTimestamp) {
        if (rawTimestamp.match(/^(\d\d\d\d-\d\d-\d\d\s+)?\d\d:\d\d$/)[1]) {
          // Includes date
          dateTimeFormat = 'datetime'
          dateTime = moment(rawTimestamp, "YYYY-MM-DD HH:mm")
        } else {
          // Time only
          dateTimeFormat = 'time'
          dateTime = moment(rawTimestamp, "HH:mm")
        }
      } else {
        dateTimeFormat = null
        dateTime = null
      }
      
      return {
        text,
        name,
        type,
        dateTime,
        dateTimeFormat
      }
    }
  })
  .filter(function(n){ return n !== undefined })
  
  recipientName = recipientNames.length > 1 ? "Group" : recipientNames[0]
  messages = messages.reduce(function(acc, msg, i, arr) { 
    if (recipientName !== "Group") { delete msg.name }
    
    return acc.concat(Object.assign(msg, smartTimestamp(msg, i, acc)))
  }, [])
  
  return [messages, recipientName]
}

function setMessages(messages) {
  m.clean();
  m.addMessages(messages, undefined, false);
}

function updatePreview(){
  const rawMessages = $("#message-content").val()
  const senderName = $("#message-sender").val()
  const [messages, recipientName] = parseMessages(rawMessages, senderName)
  $("#name-result").html(recipientName)

  setMessages(messages);
}

$(document).ready(function(){
  f = new Framework7();
  m = f.messages('.messages', {
    autoLayout: true,
    messageTemplate: `
      {{#if day}}{{#if time}}
      <div class="messages-date">{{day}}{{#if time}} <span>{{time}}</span>{{/if}}</div>
      {{/if}}{{/if}}
      <div class="message message-{{type}} {{#if hasImage}}message-pic{{/if}} {{#if avatar}}message-with-avatar{{/if}} {{#if position}}message-appear-from-{{position}}{{/if}}">
          {{#if name}}<div class="message-name">{{name}}</div>{{/if}}
          <div class="message-text">{{text}}{{#if date}}<div class="message-date">{{date}}</div>{{/if}}</div>
          {{#if avatar}}<div class="message-avatar" style="background-image:url({{avatar}})"></div>{{/if}}
          {{#if label}}<div class="message-label">{{label}}</div>{{/if}}
      </div>
    `
  })
  $('#controls-container textarea, #controls-container input[type]').keyup(updatePreview)
})
