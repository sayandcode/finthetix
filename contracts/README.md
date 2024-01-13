# Finthetix

- [Staking Contract](#staking-contract)
  - [Whitepaper](#cool-stuff-now-tell-me-how-whitepaper)
  - [@dev README](#dev-readme)


## Staking Contract 
The Finthetix Staking Contract is heavily based on the Synthetix Staking Contract. The latter grants out a fixed quantity of reward tokens at a specified interval. The addresses that stake for the contract are granted a portion of these reward tokens in proportion to their staked amount relative to the total quantity of staked tokens.

Implementing the same in Solidity however, requires some Mathematical gymnastics. The issue here is that Smart Contracts are intended to be extremely gas efficient at runtime, in order to minimize the transaction costs. This presents us with the impetus to offload the computational complexity of such an algorithm as it would normally be represented, by making use of mathematical constructs similar to indices.

In plain language, instead of storing all the data in its original form and conducting the calculation at the time of requirement, we store only the necessary data and preemptively conduct the required computations and store them in a running counter. 

This gives us two main benefits:
- No need to repeatedly run expensive computations
- The costs of expensive computations are distributed amongst the bulk of all transactions

### Cool stuff. Now tell me how? [Whitepaper]
#### Common sense approach

The rewards earned by a user would be given by the equation

$$r_{user,a\ to\ b}=\sum_{t=a}^{b}\dfrac{s_{user}}{s_{total}}R$$

Traditionally, this would mean calculating the reward earned at each discrete time interval and adding those all up. This doesn't seem like too much of a problem in normal programming terms. Except that you would have to store the amount staked by each user at every interval of time.

> RIP Storage, RIP Computation

We're used to the luxury of essentially infinite storage and compute in normal web programming. But the cost here is huge. The fact to consider here is that we don't really care about any of this information that's being stored.

#### So what do we care about?
The rewards owed to a user **now** is all we really care about. So instead of chosing to store the amount staked by a user at each interval, the first optimization is to simply compute and store the rewards owed in a simple counter.

$$Total\ rewards\ owed\ to\ a\ user,\ r_{user,total}$$

But this still doesn't absolve us of running that expensive computation to calculate the rewards. This is where the smart folks at Synthetix applied themselves. But more on that later.

The first thing we can think of doing is calculating the rewards owed to each user, whenever there is some change in the staked amount. This allows us to move out $s_{user}$ and $s_{total}$, as they are constants upto (but not at) the current time, b. As a matter of fact, even $R$, the rewards per second is constant.

$$r_{user,a\ to\ b}=R\dfrac{s_{user}}{s_{total}}\sum_{t=a}^b1$$

which can be simplified to

$$r_{user,a\ to\ b}=R\dfrac{s_{user}}{s_{total}}(b-a)$$

As you can see, the above equation doesn't require any loops. Thus we save on expensive computation. Now we just need to add this to the running counter.

$$r_{user,total(new)}=r_{user,total(current)}+r_{user,a\ to\ b}$$

#### Not so fast
The astute may have noted that while we are absolved of running any loops for computing the rewards for individual users, we still have to calculate the reward for each single user in our staking pool, at each interaction with the contract.

> for each user.... that's a loop!

Back to the drawing board. Let's take another look at our equation.

$$r_{user,a\ to\ b}=\sum_{t=a}^{b}\dfrac{s_{user}}{s_{total}}R$$

Our premise was solid: we extract those elements that don't require iteration (as they're constant), and iteratively compute a running counter for the rest. From that perspective, we can ask ourselves

> What is constant at each interaction with the smart contract?

The reward rate, $R$, obviously. But also, the amount staked by the user! Whenever the user interacts with the contract to change the amount staked, that change only affects computations that occur _subsequently_. So between any period of time $a$ and $b$, the reward earned by a user is

$$r_{user,a\ to\ b}=s_{user}R\sum_{t=a}^{b}\dfrac{1}{s_{total}}$$

So at the point of interaction with the contract, we only need to compute the above and store it to the running rewards counter $r_{user,total}$. And in this equation, the only piece of intensive computation is

$$S_{a\ to\ b} = \sum_{t=a}^{b}\dfrac{1}{s_{total}}$$

That doesn't look too good though. In order to compute this, we need to have in store the total amount staked in the contract, at every given instant. It's a huge improvement from having to store each user's staked amount at each instant. But we want to improve this even more.

Before we proceed, this is what we have so far

$$r_{user,a\ to\ b}=s_{user} \times R \times S_{a\ to\ b}$$


#### Let's put this in a running counter

In the spirit of what has worked for us so far, we could compute the value of $S$ at each interaction (where $s_{total}$ changes) and it to a counter, $S_{0\ to\ t_{now}}$.

$$S_{0\ to\ t_{now},\ new} = S_{0\ to\ t_{now},\ old} + \sum_{t=t_{last\ interaction\ of\ contract}}^{t_{now}}\dfrac{1}{s_{total}}$$

or

$$S_{0\ to\ t_{now},\ new} = S_{0\ to\ t_{now},\ old} + \dfrac{1}{s_{total}}(t_{now}-t_{last\ interaction\ of\ contract})$$

So this running counter is computing the sum of these values since the inception of the contract.

$$S_{0\ to\ t_{now}} = \sum_{t=0}^{t_{now}}\dfrac{1}{s_{total}}$$

What we require is only a subset of this running counter, which is the value from time $a$ to $b$, $S_{a\ to\ b}$.

In our case, we are only ever interested in the rewards owed at the current instant, not the historical rewards owed. So we can say that $b$ is always the current time, which is when the interaction happens with the contract. Similarly $a$ is when the user last interacted with the contract

$$a=t_{last\ interaction\ of\ user},\ b=t_{now}$$

So our requirement is

$$S_{t_{last\ interaction\ of\ user}\ to\ t_{now}} = \sum_{t=t_{last\ interaction\ of\ user}}^{t_{now}}\dfrac{1}{s_{total}}$$

To reiterate, our required value is a subset of our running counter. So our running counter is equal to our required value, plus some unknown value, $x$.

$$S_{0\ to\ t_{now}} = S_{t_{last\ interaction\ of\ user}\ to\ t_{now}} + x$$

or, calculating $x$

$$x=S_{0\ to\ t_{now}} - S_{t_{last\ interaction\ of\ user}\ to\ t_{now}} $$

$$x = \sum_{t=0}^{t_{now}}\dfrac{1}{s_{total}} - \sum_{t=t_{last\ interaction\ of\ user}}^{t_{now}}\dfrac{1}{s_{total}}$$

We can split the summation from $0$ to $t_{now}$ as the sum of summation from $0$ to $t_{last\ interaction\ of\ user}$ and $t_{last\ interaction\ of\ user}$ to $t_{now}$

$$x=(\sum_{t=0}^{t_{last\ interaction\ of\ user}}\dfrac{1}{s_{total}} + \sum_{t=t_{last\ interaction\ of\ user}}^{t_{now}}\dfrac{1}{s_{total}}) - \sum_{t=t_{last\ interaction\ of\ user}}^{t_{now}}\dfrac{1}{s_{total}}$$

Cancelling the common terms,

$$x=\sum_{t=0}^{t_{last\ interaction\ of\ user}}\dfrac{1}{s_{total}}$$

This is simply the value of our running counter, at the point the user last interacted with the contract.

$$x=S_{0\ to\ t_{last\ interaction\ of\ user}}$$

Plugging this back in to our earlier equation 

$$S_{0\ to\ t_{now}} = S_{t_{last\ interaction\ of\ user}\ to\ t_{now}} + x$$

$$S_{0\ to\ t_{now}} = S_{t_{last\ interaction\ of\ user}\ to\ t_{now}} + S_{0\ to\ t_{last\ interaction\ of\ user}}$$

And then rearranging to get our required value, 

$$S_{t_{last\ interaction\ of\ user}\ to\ t_{now}} = S_{0\ to\ t_{now}} - S_{0\ to\ t_{last\ interaction\ of\ user}} $$


#### How does that help?

This essentially means that we only need to maintain one counter. Or to be more explicit, we only need to _compute_ one counter. But we maintain separately the value of this counter for each user, at the time the interact with the token. The value at each interaction is also stored as a variable.

The key advantage here is _no more loops!_ But we also massively reduced the number of variables to maintain; from $(2 \times n_{users} \times n_{interactions})$ variables to $n_{interations}$ variables to $n_{users}$ variables. This is advantageous as the number of users could be constant, increasing or decreasing. But in comparison, we eliminated having to maintain new variables at each interaction. 

As our protocol grows and becomes more successful, we can expect an increase in the number of interactions, and the _Total Value Locked(TVL)_. We don't necessarily need to be worried about the number of users growing. So our smart contract remains robust as the storage used doesn't grow linearly with time (and inevitably run out of space), but grows only as the userbase grows (which is a reasonable tradeoff!).

#### Show me the money
So every time the user interacts with the contract, we calculate the rewards earned since the last interaction

$$r_{user,t_{last\ interaction\ of\ user}\ to\ t_{now}} = s_{user} \times R \times S_{t_{last\ interaction\ of\ user}\ to\ t_{now}}$$

Here we can substitute $S_{t_{last\ interaction\ of\ user}\ to\ t_{now}}$ with the values from our running counters.

$$r_{user,t_{last\ interaction\ of\ user}\ to\ t_{now}} = s_{user} \times R \times (S_{0\ to\ t_{now}} - S_{0\ to\ t_{last\ interaction\ of\ user}}) $$

and add this value to the variable storing the absolute number of rewards they've earned

$$r_{user,total(new)}=r_{user,total(current)}+r_{user,t_{last\ interaction\ of\ user}\ to\ t_{now}}$$

When the user asks to redeem their tokens, we run the above calculation for total rewards, and give them their reward accordingly.

The final formulas which you see above involve no loops, just simple arithmetic. Aah math you beauty!

#### Give me some examples

Hopefully by now you have a solid understanding of the logic for the Staking Contract. If you don't, check out [Smart Contract Programmer's videos](https://www.youtube.com/watch?v=6ZO5aYg1GI8&pp=ygUjc21hcnQgY29udHJhY3QgcHJvZ3JhbW1lciBzeW50aGV0aXg%3D) on this topic. He covers quite a few examples on this topic in his several videos.

### @dev README

This project is built with [foundry](https://book.getfoundry.sh/).

#### Commands

##### Build

```shell
$ forge build
```

##### Test

```shell
$ forge test
```

##### Gas Snapshots

```shell
$ forge snapshot
```
