<template>
  <q-layout>
    <div slot="header" class="toolbar">
      <q-toolbar-title :padding="0">
        BTS2 Transfer
      </q-toolbar-title>
    </div>

    <!--
      Replace following "div" with
      "<router-view class="layout-view">" component
      if using subRoutes
    -->
    <div class="layout-view">
      <div class="layout-padding">
        <p class="caption">Accounts</p>
        <div class="stacked-label">
          <input v-model="fromAccount" class="full-width" />
          <label>From</label>
        </div>
        <div class="stacked-label">
          <input v-model="toAccount" class="full-width" />
          <label>To</label>
        </div>
        <p class="caption">Asset</p>
        <div class="stacked-label">
          <input v-model="sendAmount.amount" class="full-width" />
          <label>Amount</label>
        </div>
        <div class="stacked-label">
          <br/>
           <q-select type="list" v-model="sendAmount.asset" :options="assetNames"></q-select>
          <label>Asset</label>
        </div>
        <div class="stacked-label">
          <br/>
          <input v-model="sendAmount.asset" class="full-width" />
          <label>Or Input Asset Name</label>
        </div>
        <div class="stacked-label">
          <br/>
          <input v-model="feeAssetName" class="full-width" />
          <label>Fee Asset Name</label>
        </div>
        <button class='full-width primary' @click='generateTrx'>Generate Trx</button>
        <p class="caption">Trx <button v-clipboard:copy='trxJson' class='secondary'>Copy</button></p>
        <textarea readonly='true' class='full-width' rows='10' cols='80' v-model='trxJson'></textarea>
        <p class="caption">Signed Trx</p>
        <textarea class='full-width' rows='10' cols='80' v-model='signedTx'></textarea>
        <button class='full-width primary' @click='broadcastTx'>Broadcast</button>
        <p class="caption">Tx. Fee</p>
        <textarea class='full-width' rows='10' cols='80' v-model='trxForFee'></textarea>
        <button class='full-width primary' @click='getFee'>Get Fee</button>
        <p class="caption">Signature</p>
        <textarea class='full-width' rows='10' cols='80' v-model='signature'></textarea>
        <button class='full-width primary' @click='toSigned'>To Signed Trx</button>
        </div>
      </div>

    </div>
  </q-layout>
</template>

<script>
import apiManager from 'bts-connection'
import {TransactionBuilder} from "bitsharesjs"
import {Apis, ChainConfig} from "bitsharesjs-ws"
import {extend} from 'lodash'
import {Toast} from 'quasar'
var concat = require('concat-stream');
ChainConfig.expire_in_secs = 60 * 60;
export default {
  data () {
    return {
      fromAccount:'',
      toAccount:'',
      trxForFee:'',
      signature: '',
      feeAssetName: 'BTS',
      sendAmount: {
            amount: 1,
            asset: "CNY"
        },
      assetNames: [
        {label:'CNY', value:'CNY'},
        {label:'USD', value:'USD'},
        {label:'BTS', value:'BTS'},
        {label:'OPEN.BTC', value:'OPEN.BTC'}
      ],
      trxJson: '',
      signedTx: ''
    }
  },
  methods: {
    generateTrx () {
      Promise.all([
        apiManager.exec_db('get_account_by_name', [this.fromAccount]),
        apiManager.exec_db('get_account_by_name', [this.toAccount]),
        apiManager.getAsset(this.sendAmount.asset),
        apiManager.getAsset(this.feeAssetName)
        ]).then(([btsFromAccount, btsToAccount, sendAsset, feeAsset]) => {
                let tr = new TransactionBuilder()

                tr.add_type_operation( "transfer", {
                    fee: {
                        amount: 0,
                        asset_id: feeAsset.id
                    },
                    from: btsFromAccount.id,
                    to: btsToAccount.id,
                    amount: { amount: sendAsset.toIntAmount(this.sendAmount.amount), asset_id: sendAsset.id }
                } )

                return tr.set_required_fees().then(() => {
                    return tr.finalize();
                }).then(()=>{
                    this.trxJson = JSON.stringify(extend({tr_buffer:tr.tr_buffer.toString('hex'), chain_id:Apis.instance().chain_id}, tr.toObject()))
                    this.trxForFee = JSON.stringify(tr.toObject())
                    // tr.add_signer(pKey, pKey.toPublicKey().toPublicKeyString());
                    // console.log("serialized transaction:", tr.serialize());
                    // tr.broadcast();
                })
        }).catch(e=>{
          console.error(e)
          Toast.create.negative(e)
        })
    },
    broadcastTx() {
      Promise.resolve().then(()=>{
        var tx = new TransactionBuilder()
        extend(tx, JSON.parse(this.signedTx))
        return Apis.instance().network_api().exec('broadcast_transaction', [tx])
      }).then(() => {
        Toast.create.positive('Broadcasted')
      }).catch(e => {
        console.error(e)
        Toast.create.negative(e)
      })
    },
    getFee() {
      Promise.resolve().then(()=>{
        var tr = new TransactionBuilder()
        extend(tr, JSON.parse(this.trxForFee))
        return tr.set_required_fees().then(() => {
            return tr.finalize();
        }).then(()=>{
            this.trxJson = JSON.stringify(extend({tr_buffer:tr.tr_buffer.toString('hex'), chain_id:Apis.instance().chain_id}, tr.toObject()))
            // tr.add_signer(pKey, pKey.toPublicKey().toPublicKeyString());
            // console.log("serialized transaction:", tr.serialize());
            // tr.broadcast();
        })
      }).then(() => {
        Toast.create.positive('Fee Got')
      }).catch(e => {
        console.error(e)
        Toast.create.negative(e)
      })
    },
    toSigned() {
      var tx = extend(JSON.parse(this.trxJson), {signatures:[this.signature]})
      delete tx.tr_buffer
      delete tx.chain_id
      this.signedTx = JSON.stringify(tx)
    }
  },
  mounted () {
  }
}
</script>

<style>

</style>
