const Koa = require('koa');
const bodyParser = require('koa-bodyparser'); //用于解析request的body
const router = require('koa-router')(); //负责处理url映射
const request = require('request');
const cors = require('koa-cors');

const app = new Koa();
const ipAddress = 'http://172.20.12.129:8080/zstack';
const password = "b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86";
const accountName = "admin";
var allInventory = {
  zone: "",
  cluster: "",
  kvmHost: "",
  nfsPrimaryStorage: "",
  sftpBackupStorage: "",
  attachPrimaryStorageToCluste: "",
  attachBAckupStorageToZone: "",
  image: "",
  l2NoVlanNetwork: "",
  l3PublicNetwork: "",
  l3PublicNetworkIpRange: "",
  eip: "",
  vip: "",
  vMInstance: "",
  instanceOffering: "",
  attachNetworkServiceToL3Network: "",
  attachL2NetworkToCluster: "",
  publicL3NetworkDns: "",
  attachL2NoVlanNetworkToCluster: "",
  networkServiceProvider: ""
};
var sessionUuid;

app.use(cors());

app.use(bodyParser());

request({
  method: 'PUT',
  url: ipAddress + '/v1/accounts/login',
  json: {
    "logInByAccount": {
      "password": password,
      "accountName": accountName
    }
  }
}, (err, response, body) => {
  if (err)
    console.log(err);
  sessionUuid = body.inventory.uuid;
  request({
    method: 'POST',
    url: ipAddress + '/v1/zones',
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-zone',
    },
    json: {
      "params": {
        "name": "ZoneTest",
        "description": "test zone"
      },
      "systemTags": [],
      "userTages": []
    }
  });
})


router.post('/create-zone', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  ctx.response.status = 200;
  allInventory.zone = ctx.request.body.inventory;
  console.log('createZone');
  request({
    method: 'POST',
    url: ipAddress + '/v1/clusters',
    json: {
      "params": {
        "zoneUuid": allInventory.zone.uuid,
        "name": "ClusterTest",
        "description": "just test",
        "hypervisorType": "KVM"
      },
      "systemTags": [],
      "userTages": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-cluster'
    }
  });
})

router.post('/create-cluster', async(ctx, nest) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.cluster = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('createCluster');
  request({
    method: 'POST',
    url: ipAddress + '/v1/hosts/kvm',
    json: {
      "params": {
        "name": "HostTest",
        "clusterUuid": allInventory.cluster.uuid,
        "managementIp": "192.168.99.93",
        "username": "root",
        "password": "password",
        "sshPort": 22.0
      },
      "systemTags": [],
      "userTages": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/add-kvm-host'
    }
  }, (err, response, body) => {
    if (err) {
      console.log(err);
    }
  })
})

router.post('/add-kvm-host', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.host = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('addKvmHost');
  request({
    method: "POST",
    url: ipAddress + '/v1/primary-storage/nfs',
    json: {
      "params": {
        "url": "192.168.99.93" + ":/nfs_root",
        "zoneUuid": allInventory.zone.uuid,
        "name": "PS1",
        "type": "NFS"
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/add-nfs-primary-storage'
    }
  }, (err, response, body) => {
    if (err) {
      console.log(err);
    }
  })
})

router.post('/add-nfs-primary-storage', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.nfsPrimaryStorage = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('addNfsPrimaryStorage');
  request({
    method: 'POST',
    url: ipAddress + '/v1/clusters/' + allInventory.cluster.uuid + '/primary-storage/' + allInventory.nfsPrimaryStorage.uuid,
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/attach-nfsprimary-storage'
    }
  })
})

router.post('/attach-nfsprimary-storage', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.attachPrimaryStorageToCluster = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('attachNfsPrimaryStorageToCluster');
  request({
    method: "POST",
    url: ipAddress + "/v1/backup-storage/sftp",
    json: {
      "params": {
        "hostname": "10.0.38.145",
        "username": "root",
        "password": "password",
        "sshPort": 22.0,
        "url": "/home/sftpBackupStorage",
        "name": "SftpTest",
        "importImage": false
      },
      "systemTags": [],
      "userTages": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/add-sftp-back-storage'
    },
  })
})

router.post('/add-sftp-back-storage', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.sftpBackupStorage = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('addSftpBackStorage');
  request({
    method: 'POST',
    url: ipAddress + '/v1/zones/' + allInventory.zone.uuid + '/backup-storage/' + allInventory.sftpBackupStorage.uuid,
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/attach-backup-storage-to-zone'
    }
  })
})

router.post('/attach-backup-storage-to-zone', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.attachBackupStorageToZone = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('attachBackupStorageToZone');
  request({
    method: 'POST',
    url: ipAddress + '/v1/images',
    json: {
      "params": {
        "name": "TinyLinux",
        "url": "http://192.168.200.100/mirror/diskimages/CentOS6-test-image-4G.qcow2",
        "mediaType": "RootVolumeTemplate",
        "system": false,
        "format": "qcow2",
        "platform": "Linux",
        "backupStorageUuids": [allInventory.sftpBackupStorage.uuid]
      },
      "systemTags": [],
      "userTages": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/add-image'
    }
  })
})

router.post('/add-image', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.image = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('addImage');
  request({
    method: "POST",
    url: ipAddress + '/v1/l2-networks/no-vlan',
    json: {
      "params": {
        "name": "Test-Net",
        "description": "Test",
        "zoneUuid": allInventory.zone.uuid,
        "physicalInterface": "eth0"
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-l2-novlan-network'
    }
  })
})

router.post('/create-l2-novlan-network', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.l2NoVlanNetwork = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('createL2NoVlanNetwork');
  request({
    method: "POST",
    url: ipAddress + "/v1/l2-networks/" + allInventory.l2NoVlanNetwork.uuid + "/clusters/" + allInventory.cluster.uuid,
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/attach-l2-novlan-network-to-cluster'
    }
  })
})

router.post('/attach-l2-novlan-network-to-cluster', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.attachL2NoVlanNetworkToCluster = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('attachL2NoVlanNetworkToCluster');
  request({
    method: "POST",
    url: ipAddress + "/v1/l3-networks",
    json: {
      "params": {
        "name": "Test-L3Network",
        "type": "L3BasicNetwork",
        "l2NetworkUuid": allInventory.l2NoVlanNetwork.uuid,
        "system": false
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-l3-public-network'
    }
  })
})

router.post('/create-l3-public-network', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.l3PublicNetwork = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('createL3PublicNetwork');
  request({
    method: "POST",
    url: ipAddress + "/v1/l3-networks/" + allInventory.l3PublicNetwork.uuid + "/ip-ranges",
    json: {
      "params": {
        "name": "Test-IP-Range",
        "startIp": "10.97.0.100",
        "endIp": "10.97.0.120",
        "netmask": "255.0.0.0",
        "gateway": "10.0.0.1"
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/add-public-ip-range'
    }
  })
})

router.post('/add-public-ip-range', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.l3PublicNetworkIpRange = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('addPublicIpRange');
  request({
    method: "POST",
    url: ipAddress + "/v1/l3-networks/" + allInventory.l3PublicNetwork.uuid + "/dns",
    json: {
      "params": {
        "dns": "8.8.8.8"
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/add-dns-to-public-l3-network'
    }
  })
})

router.post('/add-dns-to-public-l3-network', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.publicL3NetworkDns = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('addDnsToPublicL3Network');
  request({
    method: "POST",
    url: ipAddress + "/v1/l2-networks/vlan",
    json: {
      "params": {
        "vlan": 10.0,
        "name": "Test-Net",
        "description": "Test",
        "zoneUuid": allInventory.zone.uuid,
        "physicalInterface": "eth0"
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-l2-vlan-network'
    }
  })
})

router.post('/create-l2-vlan-network', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.l2VlanNetwork = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('createL2VlanNetwork');
  request({
    method: "POST",
    url: ipAddress + "/v1/instance-offerings",
    json: {
      "params": {
        "name": "instanceOffering",
        "cpuNum": 2.0,
        "memorySize": 134217728.0,
        "sortKey": 0.0,
        "type": "UserVm"
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-instance-offering'
    }
  })
})

router.post('/create-instance-offering', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.instanceOffering = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('createInstanceOffering');
  request({
    method: "POST",
    url: ipAddress + "/v1/vm-instances",
    json: {
      "params": {
        "name": "vm1",
        "instanceOfferingUuid": allInventory.instanceOffering.uuid,
        "imageUuid": allInventory.image.uuid,
        "l3NetworkUuids": [
          allInventory.l3PrivateNetwork.uuid
        ],
        "clusterUuid": allInventory.cluster.uuid,
        "description": "this is a vm"
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-vm-instance'
    }
  })
})

router.post('/create-vm-instance', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.vMInstance = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('createVmInstance');
  request({
    method: "POST",
    url: ipAddress + "/v1/vips",
    json: {
      "params": {
        "name": "vip1",
        "l3NetworkUuid": allInventory.l3PublicNetwork.uuid,
        "requiredIp": "10.97.0.101"
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-vip'
    }
  })
})

router.post('/create-vip', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.vip = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('createVip');
  request({
    method: "POST",
    url: ipAddress + "/v1/eips",
    json: {
      "params": {
        "name": "Test-EIP",
        "vipUuid": allInventory.vip.uuid,
        "vmNicUuid": allInventory.vMInstance.vmNics.uuid,
      },
      "systemTags": [],
      "userTags": []
    },
    headers: {
      'Authorization': 'OAuth ' + sessionUuid,
      'X-Web-Hook': 'http://172.20.250.151:8000/create-eip'
    }
  })
})

router.post('/create-eip', async(ctx, next) => {
  if (ctx.request.header["x-job-success"] != "true")
    return
  allInventory.eip = ctx.request.body.inventory;
  ctx.response.status = 200;
  console.log('createEip');
})

app.use(router.routes());



app.listen(8000);
console.log('server run at http://127.0.0.1:8000');