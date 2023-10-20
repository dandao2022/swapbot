// SPDX-License-Identifier: MIT
pragma solidity >=0.8.18;
struct Slot0 {
    // the current price
    uint160 sqrtPriceX96;
    // the current tick
    int24 tick;
    // the most-recently updated index of the observations array
    uint16 observationIndex;
    // the current maximum number of observations that are being stored
    uint16 observationCardinality;
    // the next maximum number of observations to store, triggered in observations.write
    uint16 observationCardinalityNext;
    // the current protocol fee as a percentage of the swap fee taken on withdrawal
    // represented as an integer denominator (1/x)%
    uint8 feeProtocol;
    // whether the pool is locked
    bool unlocked;
}
struct ContractBaseData {
    string name;
    string symbol;
    uint8 decimals;
    uint256 totalSupply;
    address owner;
    address contractAddr;
}
struct PoolData {
    uint128 maxLiquidityPerTick;
    int24 tickSpacing;
    uint128 liquidity;
    uint24 fee;
    address token0;
    address token1;
    Slot0 slot0;
}
struct Position {
    uint96 nonce;
    address operator;
    address token0;
    address token1;
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
    uint256 feeGrowthInside0LastX128;
    uint256 feeGrowthInside1LastX128;
    uint128 tokensOwed0;
    uint128 tokensOwed1;
}
struct checkERC20Item {
    address contractAddr;
    address owner;
}
struct balanceERC20ResponseItem {
    address contractAddr;
    address addr;
    uint256 decimals;
    uint256 balance;
}
struct PositionResponse {
    uint96 nonce;
    address operator;
    address token0;
    address token1;
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
    uint256 feeGrowthInside0LastX128;
    uint256 feeGrowthInside1LastX128;
    uint128 tokensOwed0;
    uint128 tokensOwed1;
    address owner;
}
struct PairData {
    uint112 reserve0;
    uint112 reserve1;
    address token0;
    address token1;
    uint32 blockTimestampLast;
    uint256 totalSupply;
}

contract UniswapV3Pool {
    uint128 public maxLiquidityPerTick;
    int24 public tickSpacing;
    uint128 public liquidity;
    uint24 public fee;
    address public token0;
    address public token1;

    function slot0() public view virtual returns (Slot0 memory) {}
}
contract ERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    function totalSupply() public view virtual returns (uint256) {}

    function owner() public view virtual returns (address) {}

    function transfer(address recipient, uint256 amount) external virtual {}

    function balanceOf(
        address account
    ) external view virtual returns (uint256) {}
}

contract V3Position {
    function positions(uint256) public view virtual returns (Position memory) {}

    function ownerOf(uint256) public view virtual returns (address) {}
}

contract V2Pair {
    function getReserves()
        public
        view
        virtual
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        )
    {}

    function totalSupply() public view virtual returns (uint256) {}

    function token0() public view virtual returns (address) {}

    function token1() public view virtual returns (address) {}
}

contract DANDAO {
    string public name = "DANDAOERC20";
    address public _admin;
    uint256 public _fee = 0;

    constructor() {
        _admin = msg.sender;
    }

    function setFee(uint256 fee) external {
        require(msg.sender == _admin, "ERROR");
        _fee = fee;
    }
    function batchCheckERC20Balance(checkERC20Item[] memory _list)
        public
        view
        returns (balanceERC20ResponseItem[] memory)
    {
        balanceERC20ResponseItem[]
            memory _responseList = new balanceERC20ResponseItem[](_list.length);
        for (uint256 i = 0; i < _list.length; i++) {
            ERC20 fountain = ERC20(_list[i].contractAddr);
            _responseList[i].contractAddr = _list[i].contractAddr;
            _responseList[i].addr = _list[i].owner;
            _responseList[i].balance = fountain.balanceOf(_list[i].owner);
            _responseList[i].decimals = fountain.decimals();
        }
        return _responseList;
    }
    function isContract(address addr) internal view returns (bool) {
        uint size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    function withdrawETH(address _recipient) external {
        require(msg.sender == _admin, "ERROR");
        (bool rt, ) = payable(_recipient).call{value: address(this).balance}(
            ""
        );
        require(rt);
    }

    function withdrawERC20(address _recipient, address erc20address) external {
        require(msg.sender == _admin, "ERROR");
        ERC20 fountain = ERC20(erc20address);
        uint256 balance = fountain.balanceOf(address(this));
        fountain.transfer(_recipient, balance);
    }

    function batchPoolData(
        address[] memory pools
    ) public view returns (PoolData[] memory) {
        PoolData[] memory _pooldatas = new PoolData[](pools.length);
        for (uint256 i = 0; i < pools.length; i++) {
            _pooldatas[i] = this.getPoolData(pools[i]);
        }
        return _pooldatas;
    }

    function batchBaseData(
        address[] memory addr
    ) public view returns (ContractBaseData[] memory) {
        ContractBaseData[] memory _baseDatas = new ContractBaseData[](
            addr.length
        );
        for (uint256 i = 0; i < addr.length; i++) {
            _baseDatas[i] = this.getBaseData(addr[i]);
        }
        return _baseDatas;
    }

    function getBaseData(
        address addr
    ) public view returns (ContractBaseData memory) {
        ContractBaseData memory _baseData;
        if (isContract(addr)) {
            try ERC20(addr).name() returns (string memory _name) {
                _baseData.name = _name;
            } catch {}
            try ERC20(addr).symbol() returns (string memory _symbol) {
                _baseData.symbol = _symbol;
            } catch {}
            try ERC20(addr).decimals() returns (uint8 _decimals) {
                _baseData.decimals = _decimals;
            } catch {}
            try ERC20(addr).totalSupply() returns (uint256 _totalSupply) {
                _baseData.totalSupply = _totalSupply;
            } catch {}
            try ERC20(addr).owner() returns (address _owner) {
                _baseData.owner = _owner;
            } catch {}
        }
        _baseData.contractAddr = addr;
        return _baseData;
    }

    function callUniswap(
        address contra,
        bytes memory data,
        uint256 swapamount
    ) public payable {
        require(swapamount + _fee == msg.value, "ERROR");
        (bool rt, ) = payable(contra).call{value: msg.value - _fee}(data);
        require(rt);
    }

    function batchGetPair(
        address[] memory addr
    ) public view returns (PairData[] memory) {
        PairData[] memory _pairList = new PairData[](addr.length);
        for (uint256 i = 0; i < addr.length; i++) {
            _pairList[i] = this.getPair(addr[i]);
        }
        return _pairList;
    }

    function getPair(address addr) public view returns (PairData memory) {
        PairData memory _PairData;
        if (isContract(addr)) {
            try V2Pair(addr).getReserves() returns (
                uint112 _reserve0,
                uint112 _reserve1,
                uint32 _blockTimestampLast
            ) {
                _PairData.reserve0 = _reserve0;
                _PairData.reserve1 = _reserve1;
                _PairData.blockTimestampLast = _blockTimestampLast;
            } catch {}
            _PairData.totalSupply = V2Pair(addr).totalSupply();
            _PairData.token0 = V2Pair(addr).token0();
            _PairData.token1 = V2Pair(addr).token1();
        }
        return _PairData;
    }

    function getPoolData(address addr) public view returns (PoolData memory) {
        PoolData memory _poolData;
        if (isContract(addr)) {
            try UniswapV3Pool(addr).maxLiquidityPerTick() returns (
                uint128 _maxLiquidityPerTick
            ) {
                _poolData.maxLiquidityPerTick = _maxLiquidityPerTick;
                _poolData.tickSpacing = UniswapV3Pool(addr).tickSpacing();
                _poolData.liquidity = UniswapV3Pool(addr).liquidity();
                _poolData.fee = UniswapV3Pool(addr).fee();
                _poolData.token0 = UniswapV3Pool(addr).token0();
                _poolData.token1 = UniswapV3Pool(addr).token1();
                _poolData.slot0 = UniswapV3Pool(addr).slot0();
            } catch {}
        }
        return _poolData;
    }

    function batchPositions(
        uint256[] memory tokens,
        address positionContract
    ) public view returns (PositionResponse[] memory) {
        PositionResponse[] memory _PositionResponse = new PositionResponse[](
            tokens.length
        );
        for (uint256 i = 0; i < tokens.length; i++) {
            _PositionResponse[i] = this.getPosition(
                tokens[i],
                positionContract
            );
        }
        return _PositionResponse;
    }

    function getPosition(
        uint256 token,
        address positionContract
    ) public view returns (PositionResponse memory) {
        PositionResponse memory defaultPosition;
        if (isContract(positionContract)) {
            try V3Position(positionContract).positions(token) returns (
                Position memory _position
            ) {
                defaultPosition.nonce = _position.nonce;
                defaultPosition.operator = _position.operator;
                defaultPosition.token0 = _position.token0;
                defaultPosition.token1 = _position.token1;
                defaultPosition.fee = _position.fee;
                defaultPosition.tickLower = _position.tickLower;
                defaultPosition.tickUpper = _position.tickUpper;
                defaultPosition.liquidity = _position.liquidity;
                defaultPosition.feeGrowthInside0LastX128 = _position
                    .feeGrowthInside0LastX128;
                defaultPosition.feeGrowthInside1LastX128 = _position
                    .feeGrowthInside1LastX128;
                defaultPosition.tokensOwed0 = _position.tokensOwed0;
                defaultPosition.tokensOwed1 = _position.tokensOwed1;
                defaultPosition.owner = V3Position(positionContract).ownerOf(
                    token
                );
            } catch {}
        }
        return defaultPosition;
    }
}
