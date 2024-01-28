import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

export default function Route() {
  return (
    <div className="m-4">
      {/* Staked Card */}
      <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-x-2">
        <Card className="w-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Staked</CardTitle>
            <CardDescription>
              The number of tokens you have currently staked
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-4">
            <div className="flex justify-between items-end gap-x-2">
              <div>
                <span className="font-bold text-7xl mr-2">200</span>
                <span>FST</span>
              </div>
              <div className="flex flex-col gap-y-2">
                <Button>Stake</Button>
                <Button variant="outline">Unstake</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Card */}
        <Card className="w-full flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
            <CardDescription>
              The number of tokens you have been rewarded
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-4">
            <div className="flex justify-between gap-x-2">
              <div>
                <span className="font-bold text-7xl mr-2">200</span>
                <span>FRT</span>
              </div>
              <Button className="mt-auto">Claim</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
