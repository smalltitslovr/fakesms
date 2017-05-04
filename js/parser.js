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
  return {
    day: date.calendar(null, {
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
  let dateTime = msg.dateTime

  if (i === 0) {
    if (!dateTime.isValid()) {
      // Invalid date, but it's the first message. Use now as the timestamp
      dateTime = moment()
    }
    // We're processing the first message. Show the timestamp
    return dateToTimestampParts(dateTime)
  } else if (!dateTime.isValid()) {
    // We've got an invalid date. Don't show it
    return {}
  } else {
    const prevDateTime = arr[i-1].dateTime


    if (prevDateTime.isSame(dateTime, "day")) {
      const minsApart = (dateTime - prevDateTime) / 60000;
      if (minsApart >= 5) {
        // It's been at least 5 minutes. Show the timestamp
        return dateToTimestampParts(dateTime)
      } else {
        // It's been less than 5 minutes. Don't show the timestamp
        return {}
      }

    } else {
      // We're on a new day. Show the timestamp
      return dateToTimestampParts(dateTime)
    }
  }

}

function parseMessages(input, senderName) {
  const LINE_REGEX = /^(?:\[(.*)\]\s*)?(.+?):\s*(\{)?([^\{\}]*)(\})?$/
  
  const lines = input.split('\n')
  var recipientNames = []
  var recipientName;
    
  var messages = lines.map(function(line, i) {
    const match = line.match(LINE_REGEX)
    if (match) {
      const isImage = match[3] !== undefined && match[5] !== undefined
      const text = isImage ? `<img src="${match[4]}" />` : match[4]
      
      const name = match[2]
      const isSender = senderName == name
      const type = isSender ? 'sent' : 'received'
      
      // Add the name to the list of recipients, if it's missing
      if (name !== senderName && recipientNames.indexOf(name) === -1) { recipientNames.push(name); }
      
      return {
        text,
        name,
        type,
        dateTime: moment(match[1], ["HH:mm", "YYYY-MM-DD HH:mm"])
      }
    }
  })
  .filter(function(n){ return n !== undefined })
  
  recipientName = recipientNames.length > 1 ? "Group" : recipientNames[0]
  messages = messages.map(function(msg, i, arr) { 
    if (recipientName !== "Group") { delete msg.name }
    
    
    return Object.assign(smartTimestamp(msg, i, arr), msg)
  })
  
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
