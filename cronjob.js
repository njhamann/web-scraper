var cronJob = require('cron').CronJob;
new cronJob('0 0 * * *', function(){
    console.log('You will see this message every second');
}, null, true);
