import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";


const config = new pulumi.Config();
const firstTag = config.require("firstVpc");
const secondTag = config.require("secondVpc");


/** https://github.com/pulumi/pulumi-aws/blob/d26fdf80632ded25a926f9d4ed2f5e7234dc4cf8/sdk/nodejs/ec2/getVpc.ts */
const firstVpc = aws.ec2.getVpc({
    tags: {
        Name: firstTag,
    },
});

const secondVpc = aws.ec2.getVpc({
    tags: {
        Name: secondTag,
    },
});

/** https://github.com/pulumi/pulumi-aws/blob/d26fdf80632ded25a926f9d4ed2f5e7234dc4cf8/sdk/nodejs/ec2/getRouteTables.ts */
const firstRTs = aws.ec2.getRouteTables({
    tags: {
        KubernetesCluster: firstTag,
    },
});

const secondRTs = aws.ec2.getRouteTables({
    tags: {
        KubernetesCluster: secondTag,
    },
});

/** https://github.com/pulumi/pulumi-aws/blob/52989a7f8b5fced978aff841d067ae702eac13a2/sdk/nodejs/ec2/vpcPeeringConnection.ts */
const vpcPC = new aws.ec2.VpcPeeringConnection("pulumi-vpcPeeringConnection", {
    peerVpcId: firstVpc.then(firstVpc => firstVpc.id),
    vpcId: secondVpc.then(secondVpc => secondVpc.id),
    autoAccept: true,
    tags: {
        Name: "VPC Peering Connection Pulumi Test",
    },
});

let firstVpcCidr = firstVpc.then(firstVpc => firstVpc.cidrBlock);
let secondVpcCidr = secondVpc.then(secondVpc => secondVpc.cidrBlock);

/** https://github.com/pulumi/pulumi-aws/blob/52989a7f8b5fced978aff841d067ae702eac13a2/sdk/nodejs/ec2/getVpcPeeringConnection.ts#L25 */
for (let i = 0; i < 4; i++) {
    let route = new aws.ec2.Route("pulumi-first-vpc-peering-route-" + i, {
        routeTableId: firstRTs.then(firstRTs => firstRTs.ids[i]),
        destinationCidrBlock: secondVpcCidr,
        vpcPeeringConnectionId: vpcPC.id,
    });
}

for (let i = 0; i < 4; i++) {
    let route = new aws.ec2.Route("pulumi-second-vpc-peering-route-" + i, {
        routeTableId: secondRTs.then(secondRTs => secondRTs.ids[i]),
        destinationCidrBlock: firstVpcCidr,
        vpcPeeringConnectionId: vpcPC.id,
    });
}

export const vpcFirst  = firstVpc
export const vpcSecond = secondVpc
export const rtsFirst  = firstRTs
export const rtsSecond = secondRTs
export const vpcPeerConnection = vpcPC
