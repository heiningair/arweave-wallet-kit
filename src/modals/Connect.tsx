import { AppIcon, Application, Logo } from "../components/Application";
import { Title, TitleWithParagraph } from "../components/Title";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon } from "@iconicicons/react";
import { Paragraph } from "../components/Paragraph";
import { Footer } from "../components/Modal/Footer";
import { Modal } from "../components/Modal/Modal";
import { Loading } from "../components/Loading";
import { Head } from "../components/Modal/Head";
import { Button } from "../components/Button";
import useGlobalState from "../hooks/global";
import Strategy from "../strategy/Strategy";
import styled from "styled-components";
import useModal from "../hooks/modal";
import strategies from "../strategy";

export function ConnectModal() {
  // modal controlls and statuses
  const modalController = useModal();
  const { state, dispatch } = useGlobalState();

  useEffect(() => {
    modalController.setOpen(state?.activeModal === "connect");
  }, [state?.activeModal]);

  useEffect(() => {
    if (modalController.open) return;
    setSelectedStrategy(undefined);
    dispatch({ type: "CLOSE_MODAL" });
  }, [modalController.open]);

  // selected strategy
  const [selectedStrategy, setSelectedStrategy] = useState<string>();

  // selected strategy data
  const strategyData = useMemo(
    () => strategies.find((s) => s.id === selectedStrategy),
    [selectedStrategy, strategies]
  );

  // loadings
  const [connecting, setConnecting] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // strategy available
  const [strategyAvailable, setStrategyAvailable] = useState(false);

  // show retry button
  const [retry, setRetry] = useState(false);

  // go to connect screen for strategy
  async function goToConnect(strategyID: string) {
    // get strategy
    const s = strategies.find((s) => s.id === strategyID);

    if (!s) return;

    // check if available
    setLoadingAvailability(true);
    setSelectedStrategy(strategyID);

    let available = false;
    
    try {
      available = await s.isAvailable();
    } catch {
      available = false;
    }

    setStrategyAvailable(available);
    setLoadingAvailability(false);

    if (!available) {
      return;
    }

    await tryConnecting(s);
  }

  // try to connect
  async function tryConnecting(s: Strategy) {
    setRetry(false);
    setConnecting(true);

    try {
      await s.connect(
        state.config.permissions,
        state.config.appInfo,
        state.config.gatewayConfig
      );
    } catch {
      setRetry(true);
    }
    
    setConnecting(false);
  }

  return (
    <Modal {...modalController.bindings}>
      <Head onClose={modalController.bindings.onClose}>
        <Title
          themed={!!selectedStrategy}
          onClick={() => {
            if (!selectedStrategy) return;
            setSelectedStrategy(undefined);
          }}
        >
          {selectedStrategy && <BackButton />}
          {strategyData ? strategyData.name : "Connect wallet"}
        </Title>
      </Head>
      {(!selectedStrategy && (
        <Apps>
          {strategies.map((strategy, i) => (
            <Application
              name={strategy.name}
              description={strategy.description}
              logo={strategy.logo}
              theme={strategy.theme}
              onClick={() => goToConnect(strategy.id)}
              key={i}
            />
          ))}
        </Apps>
      )) || (
        <Connecting>
          <WalletData>
            <AppIcon colorTheme={strategyData?.theme}>
              <Logo src={strategyData?.logo} />
            </AppIcon>
            {(strategyAvailable && (
              <>
                <Title small>
                  Connecting to {strategyData?.name || ""}...
                </Title>
                <Paragraph>
                  Confirm connection request in the wallet popup window
                </Paragraph>
                {retry && strategyData && (
                  <Button onClick={() => tryConnecting(strategyData)}>
                    Retry
                  </Button>
                )}
              </>
            )) || (!loadingAvailability && (
              <>
                <Title small>
                  {strategyData?.name || ""} is not available.
                </Title>
                <Paragraph>
                  If you don't have it yet, you can try to download it
                </Paragraph>
                <Button onClick={() => window.open(strategyData?.url)}>
                  Download
                </Button>
              </>
            ))}
            {connecting || loadingAvailability && <ConnectLoading />}
          </WalletData>
        </Connecting>
      )}
      <Footer>
        <TitleWithParagraph>
          <Title small>
            New to Arweave?
          </Title>
          <Paragraph small>
            Click to learn more about the permaweb & wallets.
          </Paragraph>
        </TitleWithParagraph>
        <Button>
          MORE
        </Button>
      </Footer>
    </Modal>
  );
}

const Apps = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1.2rem;
  max-height: 280px;
  overflow-y: auto;
`;

const Connecting = styled.div`
  position: relative;
  height: 280px;
`;

const WalletData = styled.div`
  position: absolute;
  top: 45%;
  left: 50%;
  width: 70%;
  transform: translate(-50%, -50%);

  ${AppIcon} {
    margin: 0 auto .65rem;
  }

  ${Title} {
    text-align: center;
    font-weight: 700;
    margin-bottom: .1rem;
    justify-content: center;
  }

  ${Paragraph} {
    text-align: center;
  }

  ${Button} {
    margin: 0 auto;
    margin-top: 1rem;
  }
`;

const ConnectLoading = styled(Loading)`
  display: block;
  margin: 0 auto;
  margin-top: 1rem;
  color: rgb(${props => props.theme.primaryText});
  width: 1.25rem;
  height: 1.25rem;
`;

const BackButton = styled(ChevronLeftIcon)`
  font-size: 1em;
  width: 1em;
  height: 1em;
  cursor: pointer;
  color: rgb(0, 122, 255);
  transform: scale(1.75);
  transition: transform .125s ease;

  &:active {
    transform: scale(1.5);
  }
`;
