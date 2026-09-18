<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import OLViewer from '../components/openlayers/OLViewer.vue'
import { demoLocations, entries, onsiteImages, onsiteStops, practicalInfo } from '../data/demo'

const xiaoxitian = demoLocations.find(item => item.id === 14)!
const activeReport = ref<number | null>(null)
const reportReason = ref('方向不清楚')
const submittedEntry = ref<number | null>(null)
const activeArea = ref('全部')
const areas = ['全部', ...new Set(onsiteStops.map(item => item.area))]
const visibleStops = computed(() => activeArea.value === '全部' ? onsiteStops : onsiteStops.filter(item => item.area === activeArea.value))

onMounted(() => {
  Object.values(onsiteImages).forEach((item) => {
    const image = new Image()
    image.src = item.url
  })
  const gameImage = new Image()
  gameImage.src = '/screenshots/buffer.png'
})

function submitReport() {
  if (activeReport.value === null) return
  submittedEntry.value = activeReport.value
  activeReport.value = null
}
</script>

<template>
  <div class="onsite-page">
    <header class="onsite-header">
      <div>
        <router-link to="/location-guide">返回取景地</router-link>
        <span>现场模式 · 小西天样板</span>
        <h1>按参观顺序，找到游戏里的现实线索</h1>
        <p>先看区域参照图，再用三个特征确认。所有方向为编辑整理的推荐观赏区域，不是精确机位。</p>
      </div>
      <aside>
        <small>内容已预载</small>
        <strong>{{ onsiteStops.length }} 个现场条目</strong>
        <span>弱网时已打开的文字和图片仍可浏览</span>
      </aside>
    </header>

    <main>
      <section class="site-overview">
        <div class="map-panel">
          <OLViewer :locations="[xiaoxitian]" :selected-location-id="14" show-layer-switcher />
        </div>
        <div class="arrival-panel">
          <span>ARRIVAL</span>
          <h2>地图只负责抵达景区</h2>
          <p>普通地图用于道路与入口判断，卫星影像用于观察山体和建筑群关系。进入院落后，请按下方照片与文字指引寻找。</p>
          <dl>
            <div><dt>开放时间</dt><dd>{{ practicalInfo.openTime }}</dd></div>
            <div><dt>拍摄规定</dt><dd>{{ practicalInfo.photoPolicy }}</dd></div>
            <div><dt>信息日期</dt><dd>{{ practicalInfo.updatedAt }}</dd></div>
          </dl>
        </div>
      </section>

      <section class="field-guide">
        <div class="guide-heading">
          <div><span>FIELD INDEX</span><h2>从入口到大雄宝殿</h2><p>按实际参观区域排列。现场开放范围有变化时，以工作人员指引为准。</p></div>
          <div class="area-tabs" aria-label="区域筛选">
            <button v-for="area in areas" :key="area" :class="{ active: activeArea === area }" @click="activeArea = area">{{ area }}</button>
          </div>
        </div>

        <article v-for="stop in visibleStops" :key="stop.entryId" class="stop-card">
          <div class="stop-order"><small>STOP</small><strong>{{ String(stop.order).padStart(2, '0') }}</strong><span>{{ stop.area }}</span></div>
          <figure>
            <img :src="stop.image" :alt="`${stop.area}区域参照图`">
            <figcaption>区域参照图 · 三猎 · CC BY-SA 4.0</figcaption>
          </figure>
          <div class="stop-copy">
            <div class="match-row"><span :class="`level-${entries[stop.entryId - 1].matchLevel}`">{{ entries[stop.entryId - 1].matchLevel }}</span><small>正式发布前需完成现场核查</small></div>
            <h3>{{ entries[stop.entryId - 1].title }}</h3>
            <p class="direction"><b>怎么走</b>{{ stop.direction }}</p>
            <p class="reference"><b>先找参照物</b>{{ stop.reference }}</p>
            <ol>
              <li v-for="point in entries[stop.entryId - 1].valuePoints" :key="point">{{ point }}</li>
            </ol>
            <footer>
              <router-link :to="`/entry/${stop.entryId}`">打开双图对照</router-link>
              <button @click="activeReport = stop.entryId">没找到</button>
              <span v-if="submittedEntry === stop.entryId">反馈已记录，等待编辑核查</span>
            </footer>
          </div>
        </article>
      </section>

      <section class="credits">
        <span>图片来源</span>
        <a v-for="item in onsiteImages" :key="item.source" :href="item.source" target="_blank" rel="noreferrer">{{ item.title }} · {{ item.author }} · {{ item.license }}</a>
      </section>
    </main>

    <div v-if="activeReport !== null" class="report-backdrop" @click.self="activeReport = null">
      <form class="report-panel" @submit.prevent="submitReport">
        <button type="button" class="close" aria-label="关闭" @click="activeReport = null">×</button>
        <small>现场纠错</small>
        <h2>哪里出了问题？</h2>
        <p>反馈仅进入采编后台待核查，不会公开显示。</p>
        <label>问题类型<select v-model="reportReason"><option>方向不清楚</option><option>区域关闭</option><option>对应物有误</option><option>拍摄规定已变化</option></select></label>
        <button type="submit" class="submit">提交反馈</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.onsite-page{height:100%;overflow-y:auto;background:#ede7dc;color:#29251f}.onsite-header{background:#171510;color:#eee5d7;padding:48px max(24px,calc((100% - 1120px)/2));display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:70px;align-items:end}.onsite-header a{color:#9c917f;font-size:11px}.onsite-header>div>span,.site-overview span,.guide-heading span,.credits>span{display:block;color:#b79255;font-size:10px;letter-spacing:3px;margin-top:30px}.onsite-header h1{max-width:760px;font:42px/1.25 Georgia,'Songti SC',serif;letter-spacing:0;margin:10px 0 14px}.onsite-header p{max-width:700px;color:#a9a094;line-height:1.8}.onsite-header aside{border-left:1px solid #4e432f;padding-left:22px;display:grid;gap:7px}.onsite-header aside small{color:#75a388}.onsite-header aside strong{font:22px Georgia,'Songti SC',serif}.onsite-header aside span{font-size:10px;color:#91887b;line-height:1.6}.onsite-page main{max-width:1120px;margin:auto;padding:34px 24px 80px}.site-overview{display:grid;grid-template-columns:1.35fr .65fr;min-height:360px;border:1px solid #cfc4b4;background:#f5f0e8}.map-panel{min-height:360px}.arrival-panel{padding:30px}.arrival-panel span{margin-top:0}.arrival-panel h2,.guide-heading h2{font:29px Georgia,'Songti SC',serif;letter-spacing:0;margin:9px 0}.arrival-panel>p,.guide-heading p{color:#70685e;line-height:1.75;font-size:12px}.arrival-panel dl{margin-top:22px}.arrival-panel dl div{border-top:1px solid #d6ccbd;padding:10px 0}.arrival-panel dt{font-size:9px;color:#9b7a47}.arrival-panel dd{margin-top:4px;font-size:11px;line-height:1.5}.field-guide{margin-top:54px}.guide-heading{display:flex;justify-content:space-between;gap:25px;align-items:end;margin-bottom:22px}.guide-heading span{margin-top:0}.area-tabs{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end}.area-tabs button{height:34px;border:1px solid #c7bbab;background:transparent;color:#655d53;padding:0 11px;cursor:pointer}.area-tabs button.active{background:#2d2922;color:#eee4d4;border-color:#2d2922}.stop-card{display:grid;grid-template-columns:90px 280px 1fr;border-top:1px solid #cbbfad;padding:22px 0;gap:24px}.stop-order{display:flex;flex-direction:column}.stop-order small{font-size:8px;color:#9d7b47}.stop-order strong{font:34px Georgia,serif;color:#302a22}.stop-order span{font-size:10px;color:#766c60;margin-top:auto}.stop-card figure{height:210px;position:relative;overflow:hidden;background:#262119}.stop-card figure img{width:100%;height:100%;object-fit:cover}.stop-card figcaption{position:absolute;left:0;right:0;bottom:0;padding:18px 9px 7px;background:linear-gradient(transparent,#17130ddd);color:#ddd0bc;font-size:8px}.stop-copy{min-width:0}.match-row{display:flex;align-items:center;gap:9px}.match-row>span{padding:4px 7px;font-size:9px;background:#80683e;color:#fff}.match-row .level-参考元素{background:#71695e}.match-row small{color:#9a604a}.stop-copy h3{font:23px/1.3 Georgia,'Songti SC',serif;margin:10px 0 14px}.stop-copy p{font-size:11px;color:#655d53;line-height:1.65;margin:7px 0}.stop-copy p b{display:inline-block;min-width:74px;color:#946f39}.stop-copy ol{display:flex;gap:6px;list-style:none;margin-top:14px;flex-wrap:wrap}.stop-copy li{border:1px solid #c7bbab;padding:5px 8px;font-size:9px;color:#625a50}.stop-copy footer{display:flex;align-items:center;gap:15px;margin-top:16px}.stop-copy footer a{background:#aa8246;color:#18130d;padding:8px 12px;font-size:10px;font-weight:700}.stop-copy footer button{border:0;background:none;color:#796c5c;text-decoration:underline;cursor:pointer}.stop-copy footer span{font-size:9px;color:#52775f}.credits{margin-top:34px;border-top:1px solid #cbbfad;padding-top:20px;display:flex;gap:12px;flex-wrap:wrap}.credits>span{width:100%;margin:0}.credits a{font-size:9px;color:#706354;text-decoration:underline}.report-backdrop{position:fixed;inset:0;z-index:300;background:#0c0a08b8;display:grid;place-items:center;padding:20px}.report-panel{width:min(420px,100%);background:#f1eadf;padding:30px;position:relative}.report-panel .close{position:absolute;right:12px;top:9px;border:0;background:none;font-size:23px;cursor:pointer}.report-panel>small{color:#9a7846}.report-panel h2{font:28px Georgia,'Songti SC',serif;margin:8px 0}.report-panel p{color:#70675c;font-size:11px}.report-panel label{display:grid;gap:7px;margin-top:22px;font-size:11px}.report-panel select{height:40px;border:1px solid #bfb3a2;background:#fff;padding:0 9px}.report-panel .submit{width:100%;height:42px;margin-top:18px;border:0;background:#2b2721;color:#f1e8d9;cursor:pointer}
@media(max-width:760px){.onsite-header{grid-template-columns:1fr;padding:34px 20px;gap:25px}.onsite-header h1{font-size:31px}.onsite-header aside{border-left:0;border-top:1px solid #4e432f;padding:16px 0 0}.onsite-page main{padding:20px 16px 55px}.site-overview{grid-template-columns:1fr}.map-panel{min-height:270px}.arrival-panel{padding:22px}.guide-heading{display:block}.area-tabs{justify-content:flex-start;margin-top:17px;overflow-x:auto;flex-wrap:nowrap}.area-tabs button{white-space:nowrap}.stop-card{grid-template-columns:54px 1fr;gap:13px}.stop-card figure{grid-column:1/-1;height:220px}.stop-order span{writing-mode:vertical-rl;margin-top:9px}.stop-copy{grid-column:2}.stop-copy h3{font-size:20px}.stop-copy footer{align-items:flex-start;flex-wrap:wrap}.credits{display:grid}}
</style>
