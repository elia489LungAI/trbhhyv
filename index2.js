const { Client, GatewayIntentBits } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus 
} = require('@discordjs/voice');
const path = require('path');
require('ffmpeg-static');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// معلومات البوت والเซิร์ฟเวอร์
const TOKEN = 'MTU0OTA0MzU4ODY5MDYxNjU0MQ.GcU2kc.bhE8gIWZgOAtYZq7lF3GK1CecaDZ2Huswr0YEY';
const VOICE_CHANNEL_ID = '1555566077457469502';
const GUILD_ID = '1547717190260629576';

// مسار ملف الصوت المحلي الموجود في مجلد المشروع
const AUDIO_FILE_PATH = path.join(__dirname, 'quran.mp3');

let connection = null;
let player = null;

function checkAndPlay(channel) {
    if (!channel) return;
    const humanMembersCount = channel.members.filter(member => !member.user.bot).size;

    if (humanMembersCount > 0 && !connection) {
        try {
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            player = createAudioPlayer();
            const resource = createAudioResource(AUDIO_FILE_PATH);

            player.play(resource);
            connection.subscribe(player);

            // إعادة تشغيل المقطع تلقائياً عند انتهائه
            player.on(AudioPlayerStatus.Idle, () => {
                try {
                    const restartResource = createAudioResource(AUDIO_FILE_PATH);
                    player.play(restartResource);
                } catch (err) {
                    console.error('خطأ عند إعادة التشغيل:', err);
                }
            });

            console.log('دخل البوت إلى الروم وبدأ تشغيل الصوت بنجاح!');
        } catch (error) {
            console.error('صار خطأ أثناء محاولة تشغيل الصوت:', error);
        }
    } else if (humanMembersCount === 0 && connection) {
        try {
            if (player) player.stop();
            connection.destroy();
            connection = null;
            player = null;
            console.log('فرغت الروم من الأعضاء، طلع البوت وفصل الاتصال.');
        } catch (error) {
            console.error('خطأ عند محاولة إيقاف وفصل البوت:', error);
        }
    }
}

client.once('clientReady', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;
    const voiceChannel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    checkAndPlay(voiceChannel);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;
    const voiceChannel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!voiceChannel) return;
    checkAndPlay(voiceChannel);
});

client.login(TOKEN);